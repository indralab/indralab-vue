<template>
  <div class='relation-search nvm'
       :style="`cursor: ${(searching) ? 'progress': 'auto'};`">
    <div id='seach-box'
         v-show='show_search'>
        <h3>Select Agents</h3>
        <div class="form-inline"
             v-for="(agent, agent_idx) in agents"
             :key='agent_idx'>
          <span class='spaced click'
                @click='removeAgent(agent_idx)'>
              &#10005;
          </span>
          <select class="form-control"
                  v-model='agent.role'>
            <option v-for='role in role_options'
                    :key='role'
                    :value='role'>
              {{ role }}
            </option>
          </select>
          <agent-select v-model='agent.grounding'></agent-select>
        </div>
        <span class='spaced click' @click='addAgent'>
            &#10133; agent constraint...
        </span>

        <h3>Select Type</h3>
        <input class="form-control"
               type="text"
               v-model='stmt_type'
               placeholder="Enter statement type...">

        <h3>Search</h3>
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
    <hr>

    <div id='result-box' class='nvm' v-show='relation_order !== null'>
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
        agents: [],
        stmt_type: null,
        role_options: [
          'subject',
          'object',
          'none',
        ],
        relation_order: null,
        relation_lookup: null,
        show_search: true,
        searching: false,
        next_offset: 0
      }
    },
    methods: {
      addAgent: function() {
        this.agents.push({grounding: null, role: 'none'})
      },

      removeAgent: function(agent_idx) {
        const new_agents = [];
        this.agents.forEach( (entry, idx) => {
          if (idx === agent_idx)
            return;
          new_agents.push(entry);
        });
        this.agents = new_agents;
      },

      searchButton: async function() {
        for (let ag of this.agents) {
            if (!ag.grounding) {
                alert("Please fill out agent form completely.");
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

        // Format the agents into the query.
        let tagged_ag, gnd, role;
        for (let idx in this.agents) {
          window.console.log(idx);
          gnd = this.agents[idx].grounding;
          role = this.agents[idx].role;

          tagged_ag = gnd.id + '@' + gnd.db;
          if (role === 'none')
            query_strs.push(`agent${idx}=${tagged_ag}`);
          else
            query_strs.push(`${role}=${tagged_ag}`);

        }

        // Format the statement type into the query.
        if (this.stmt_type !== null) {
          if (this.stmt_type.trim()) {
            query_strs.push(`type=${this.stmt_type}`);
          }
        }

        query_strs.push('limit=50');
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push('with_cur_counts=true');
        window.console.log(query_strs);

        // Make the query
        let url = this.$relation_url + '?' + query_strs.join('&');
        window.console.log(url);
        const resp = await fetch(url);
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
      this.addAgent();
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
