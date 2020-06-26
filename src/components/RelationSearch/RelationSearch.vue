<template>
  <div class='relation-search nvm'
       :style="`cursor: ${(searching) ? 'progress': 'auto'};`">
    <div id='seach-box'
         v-show='show_search'>
        <h3>Constrain your query</h3>
        <div class="form-inline"
             v-for="(constraint, const_idx) in constraints"
             :key='const_idx'>
          <span v-if="!constraint.type">
            <span class='spaced'>
                &#10133;
            </span>
            <select class="form-control"
                    @input="addConstraint(null)"
                    v-model="constraint.type">
              <option :value="null" selected hidden>
                select constraint...
              </option>
              <option v-for="(type_val, type_name) in constraint_types"
                      :key="type_name"
                      :value="type_val">
                {{ type_name }} constraint
              </option>
            </select>
          </span>
          <span v-else>
            <span class='spaced click'
                  @click='removeConstraint(const_idx)'>
                &#10005;
            </span>
            <span v-if="constraint.type === 'HasAgent'">
              <b>Agent:</b><agent-select v-model="constraint.constraint"></agent-select>
            </span>
            <span v-else-if="constraint.type === 'HasType'">
              <b>Type:</b><type-select v-model="constraint.constraint"></type-select>
            </span>
            <span v-else-if="constraint.type === 'FromMeshId'">
              <b>Mesh:</b><mesh-select v-model="constraint.constraint"></mesh-select>
            </span>
            <span v-else>
              <b style="color: red;">Developer error: unhandled constraint type.</b>
            </span>
          </span>
        </div>
        <button class="btn btn-primary"
                @click='searchButton'
                :disabled="searching">
          Search
        </button>
        <button class="btn btn-outline-primary"
                v-show="relation_order !== null && !empty_relations"
                @click="show_search=false">
          Hide Search Form
        </button>
    </div>
    <div v-show='!show_search'>
      <button class="btn btn-primary"
              id='search-reopen'
              @click='show_search=true'>
          Edit Search Form
      </button>
    </div>

    <div id="error-box" class="nvm" v-show="search_error">
      <hr>
      <i style="color: red">Failed to load search results: {{ search_error }}.</i>
    </div>
    <div id='result-box' class='nvm' v-show='relation_order !== null'>
      <hr>
      <h3>Results</h3>
      <hr>
      <h4 v-show='empty_relations'>Nothing found.</h4>
      <span v-for="rel_id in list_shown" :key="rel_id">
        <relation v-bind="relation_lookup[rel_id]"></relation>
      </span>
      <span v-show="searching">Loading...</span>
    </div>
  </div>
</template>

<script>
  import piecemeal_mixin from "../piecemeal_mixin";

  export default {
    name: "RelationSearch",
    props: {
      autoload: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        new_const_type: null,
        constraints: [],
        constraint_types: {agent: 'HasAgent', type: 'HasType', mesh: 'FromMeshId'},
        relation_order: null,
        relation_lookup: null,
        show_search: true,
        searching: false,
        next_offset: 0,
        search_error: null,
      }
    },
    methods: {
      addConstraint: function(constraint_type) {
        this.constraints.push({type: constraint_type, constraint: null, inverted: false})
      },

      removeConstraint: function(agent_idx) {
        const new_constraints = [];
        this.constraints.forEach( (entry, idx) => {
          if (idx === agent_idx)
            return;
          new_constraints.push(entry);
        });
        this.constraints = new_constraints;
      },

      searchButton: async function() {
        for (let query of this.constraints) {
            if (!query.type)
              continue
            if (!query.constraint) {
                alert(`Please fill out ${query.type} form completely.`);
                return;
            }
        }
        this.next_offset = 0;
        this.relation_order = null;
        this.relation_lookup = null;
        return await this.search()
      },

      search: async function() {
        // Don't run multiple searches at once.
        if (this.searching)
          return false;

        // If the database says there is nothing more to find, stop looking.
        if (this.next_offset == null) {
          window.console.log("Offset is null, ignoring search.");
          return false;
        }

        this.searching = true;
        let query_strs = [];

        // Format the constraints into the query.
        let tagged_ag, agent_id, namespace, role;
        let mesh_ids = [];
        for (let idx in this.constraints) {
          window.console.log(idx);
          let constraint = this.constraints[idx];
          if (constraint.type === null)
            continue;

          if (constraint.type === 'HasAgent') {
            // Handle agent constraints
            agent_id = constraint.constraint.agent_id;
            namespace = constraint.constraint.namespace;
            role = constraint.constraint.role;

            tagged_ag = encodeURIComponent(agent_id + '@' + namespace);
            if (role === 'any')
              query_strs.push(`agent${idx}=${tagged_ag}`);
            else
              query_strs.push(`${role}=${tagged_ag}`);
          } else if (constraint.type === 'HasType') {
            // Handle type constraints
            query_strs.push(`type=${constraint.constraint.stmt_types[0]}`);
          } else if (constraint.type === 'FromMeshId') {
            mesh_ids.push(constraint.constraint.mesh_id);
          }
        }

        if (mesh_ids.length)
          query_strs.push(`mesh_ids=${mesh_ids.join(',')}`)

        query_strs.push('limit=50');
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push('with_cur_counts=true');
        window.console.log(query_strs);

        // Make the query
        let url = this.$relation_url + '?' + query_strs.join('&');
        window.console.log(url);
        const resp = await fetch(url);

        // Check that the query is good (exit if not)
        if (resp.status !== 200) {
          this.search_error = `(${resp.status}) ${resp.statusText}`;
          this.searching = false;
          return false;
        }
        this.search_error = null;

        // Unpackage the result.
        const resp_json = await resp.json();
        window.console.log(resp_json);

        // Update the container values
        if (this.relation_order == null) {
          this.relation_order = [];
          this.relation_lookup = {};
        }
        resp_json.relations.forEach(rel => {
          if (!(rel.id in this.relation_lookup)) {
            // Add a new entry if this is new.
            rel.hashes = undefined;  // take up less space.
            this.relation_lookup[rel.id] = rel;
            this.relation_order.push(rel.id);
          } else {
            // Otherwise update the source counts.
            //   Note that you need to create a new source count dict and replace
            //   the old one rather than update the old one in place so that Vue
            //   detects the change and updates the display.
            let cnt;
            let new_src_counts = {};
            let old_src_counts = this.relation_lookup[rel.id].source_counts;
            for (let src_group of Object.values(this.$sources))
              for (let src of src_group) {
                cnt = (rel.source_counts[src] || 0) + (old_src_counts[src] || 0);
                if (cnt > 0)
                  new_src_counts[src] = cnt;
              }
            this.relation_lookup[rel.id].source_counts = new_src_counts;
          }
        });
        this.next_offset = resp_json.next_offset;

        // Decide whether to close the search box or not.
        if (this.relation_order.length > 0)
          this.show_search = false;

        this.searching = false;
        return true;
      },

      getMore: async function() {
        return await this.search()
      }
    },
    computed: {
      empty_relations: function() {
        if (this.relation_order == null)
          return false;
        if (this.relation_order.length === 0)
          return true;
        return false
      },

      base_list: function() {
        return this.relation_order;
      },
    },
    created: function() {
      this.addConstraint('HasAgent');
      this.addConstraint(null);
    },
    mixins: [piecemeal_mixin]
  }
</script>

<style scoped>
  .relation-search {
    cursor: pointer
  }
  .click {
    cursor: pointer;
  }
  .spaced {
    margin: 0 0.5em;
  }
</style>
