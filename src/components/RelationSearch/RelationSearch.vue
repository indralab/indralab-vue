<template>
  <div class='relation-search nvm'
       :style="`cursor: ${(searching) ? 'progress': 'auto'};`">
    <div id="search-row"
         v-show='show_search'>
      <div class="nav-btn">
        <h4>
          Query Constraints
          <button class="btn"
                  :disabled="cannotGoBack"
                  @click="backButton">
            &lt; Back
          </button>
          <button class="btn"
                  :disabled="cannotGoForward"
                  @click="forwardButton">
            Forward &gt;
          </button>
        </h4>
      </div>
      <div id='seach-box'>
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
            <span v-else-if="constraint.type === 'FromMeshIds'">
              <b>Mesh:</b><mesh-select v-model="constraint.constraint"></mesh-select>
            </span>
            <span v-else-if="constraint.type === 'FromPapers'">
              <b>Paper:</b><paper-select v-model="constraint.constraint"></paper-select>
            </span>
            <span v-else>
              <b style="color: red;">Developer error: unhandled constraint type.</b>
            </span>
          </span>
        </div>
        <div>
          <button class="btn btn-primary"
                  @click='searchButton'
                  :disabled="searching">
            Search
          </button>
          <button class="btn btn-outline-primary"
                  v-show="!empty_relations"
                  @click="show_search=false">
            Hide Search Form
          </button>
        </div>
      </div>
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
    <div id='result-box' class='nvm' v-if='!empty_relations'>
      <hr>
      <h4>Results</h4>
      <small>I found statements that {{ query_string }}</small>
      <hr>
      <h4 v-show='empty_relations & search_history'>Nothing found.</h4>
      <div class="text-center sticky-header" v-show="!empty_relations">
        db <source-display></source-display> rd
        <hr id="src-disp-hr">
      </div>
      <div id="result-list">
        <span v-for="agent_pair in list_shown" :key="agent_pair.id">
          <agent-pair v-bind="agent_pair" :context_queries="context_queries"></agent-pair>
        </span>
      </div>
      <span v-show="searching">Loading...</span>
    </div>
    <div v-else-if="agent_pairs !== null">
      No results found.
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
        constraints: {},
        cidx: 0,
        constraint_types: {
          agent: 'HasAgent',
          type: 'HasType',
          mesh: 'FromMeshIds',
          paper: 'FromPapers'
        },
        context_queries: null,
        agent_pairs: null,
        show_search: true,
        searching: false,
        query_string: null,
        next_offset: 0,
        search_error: null,
        search_history: [],
        history_idx: -1,
      }
    },
    methods: {
      addConstraint: function(constraint_type) {
        this.$set(this.constraints, this.cidx, {
          type: constraint_type,
          constraint: null,
          inverted: false
        });
        this.cidx ++;
      },

      removeConstraint: function(constraint_idx) {
        this.$delete(this.constraints, constraint_idx)
      },

      searchButton: async function() {
        let query;
        for (let cidx in this.constraints) {
            query = this.constraints[cidx];
            if (!query.type)
              continue
            if (!query.constraint) {
                alert(`Please fill out ${query.type} form completely.`);
                return;
            }
        }
        this.next_offset = 0;
        this.agent_pairs = null;
        this.pushHistory();
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
        this.context_queries = [];

        // Format the constraints into the query.
        let tagged_ag, agent_id, namespace, role;
        let mesh_ids = [];
        let paper_ids = [];
        for (let idx in this.constraints) {
          window.console.log(`Processing constraint ${idx}`);
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
            this.context_queries.push(
              `type=${constraint.constraint.stmt_types[0]}`
            );
          } else if (constraint.type === 'FromMeshIds') {
            mesh_ids.push(constraint.constraint.mesh_id);
          } else if (constraint.type === 'FromPapers') {
            let paper_info =  constraint.constraint.paper_list[0];
            paper_ids.push(`${paper_info[1]}@${paper_info[0]}`);
          }
        }

        if (mesh_ids.length)
          this.context_queries.push(`mesh_ids=${mesh_ids.join(',')}`);

        if (paper_ids.length)
          this.context_queries.push(`paper_ids=${paper_ids.join(',')}`);

        query_strs.push('max_stmts=50');
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push('with_cur_counts=true');
        query_strs.push('with_english=true');
        window.console.log(query_strs);
        window.console.log(this.context_queries);

        // Make the query
        let url = this.$agent_url + '?' + [...query_strs, ...this.context_queries].join('&');
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

        this.query_string = resp_json.query_str;
        if (!this.agent_pairs)
          this.agent_pairs = resp_json.relations
        else
          this.agent_pairs = [...this.agent_pairs, ...resp_json.relations]
        this.next_offset = resp_json.next_offset;

        // Decide whether to close the search box or not.
        if (this.agent_pairs.length > 0)
          this.show_search = false;

        this.searching = false;
        return true;
      },

      pushHistory: function() {
        // Handle case where we've gone back.
        if (this.history_idx !== this.search_history.length)
          this.search_history = this.search_history.slice(0, this.history_idx+1);

        // Push the latest constraint to the end of the history.
        this.search_history.push({constraints: this.deepCopy(this.constraints)});
        this.history_idx += 1;
      },

      backButton: async function() {
        if (this.cannotGoBack)
          return;
        this.history_idx -= 1;
        this.constraints = this.search_history[this.history_idx].constraints;
        this.next_offset = 0;
        this.agent_pairs = null;
        return await this.search();
      },

      forwardButton: async function() {
        if (this.cannotGoForward)
          return;
        this.history_idx += 1;
        this.constraints = this.search_history[this.history_idx].constraints;
        this.next_offset = 0;
        this.agent_pairs = null;
        return await this.search();
      },

      deepCopy: function(inObject) {
        let outObject, value, key;

        if (typeof inObject !== 'object' || inObject === null)
          return inObject;

        outObject = Array.isArray(inObject) ? [] : {};

        for (key in inObject) {
          value = inObject[key];
          outObject[key] = this.deepCopy(value);
        }

        return outObject;
      },

      getMore: async function() {
        return await this.search()
      }
    },
    computed: {
      empty_relations: function() {
        if (this.agent_pairs === null)
          return true;
        return (this.agent_pairs.length === 0);
      },

      base_list: function() {
        return this.agent_pairs;
      },

      cannotGoBack: function() {
        return this.history_idx <= 0;
      },

      cannotGoForward: function() {
       return this.history_idx >= (this.search_history.length - 1);
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

  select, input, button {
    margin: 0.2em;
  }
  .spaced {
    margin: 0 0.5em;
  }

  .nav-btn {
    margin-top: auto;
    margin-bottom: auto;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding: 5px 20px 0 20px;
    margin-left: -20px;
    margin-right: -20px;
  }

  #src-disp-hr {
    padding-right: 20px;
    padding-left: 20px;
    margin-bottom: 0;
  }

  #result-list {
    margin-top: 10px;
  }
</style>
