<template>
  <div class='relation-search'>
    <div id='seach-box'
         :style="`cursor: ${(searching) ? 'progress': 'auto'};`"
         v-show='show_search'>
        <h3>Select Agents</h3>
        <div v-for="(agent, agent_idx) in agents"
             :key='agent_idx'>
          <button @click='removeAgent(agent_idx)'>x</button>
          <select v-model='agent.role'>
            <option v-for='role in role_options'
                    :key='role'
                    :value='role'>
              {{ role }}
            </option>
          </select>
          <agent-select v-model='agent.grounding'></agent-select>
        </div>
        <button @click='addAgent'>Add Agent</button>

        <h3>Select Type</h3>
        <input v-model='stmt_type'>

        <h3>Search</h3>
        <button @click='searchButton'
                :disabled="searching">
          Search
        </button>
        <button v-show="relations !== null && !empty_relations"
                @click="show_search=false">
          Hide Search
        </button>
    </div>
    <div v-show='!show_search'>
      <button id='search-reopen' @click='show_search=true'>Edit Search</button>
    </div>
    <hr>

    <div id='result-box' v-show='relations !== null'>
      <h3>Results</h3>
      <hr>
      <h4 v-show='empty_relations'>Nothing found.</h4>
      <span v-for="rel in list_shown" :key="rel.id">
        <relation v-bind="rel"></relation>
      </span>
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
        relations: null,
        relation_ids: null,
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
        this.next_offset = 0;
        this.relations = null;
        this.relation_ids = null;
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
        let query_str = '';

        // Format the agents into the query.
        let tagged_ag, term, role;
        for (let idx in this.agents) {
          window.console.log(idx);
          term = this.agents[idx].grounding.term;
          role = this.agents[idx].role;
          if (idx != 0) {
            window.console.log(idx, idx != 0);
            query_str += '&'
          }

          tagged_ag = term.id + '@' + term.db;
          if (role === 'none')
            query_str += `agent${idx}=${tagged_ag}`;
          else
            query_str += `${role}=${tagged_ag}`;

          window.console.log(query_str)
        }

        // Format the statement type into the query.
        if (this.stmt_type !== null) {
          if (this.stmt_type.trim()) {
            if (query_str)
              query_str += '&';
            query_str += `stmt_type=${this.stmt_type}`;
            window.console.log(query_str);
          }
        }

        // Make the query
        let url = `${this.$search_url}?limit=50&offset=${this.next_offset}&${query_str}`;
        window.console.log(url);
        const resp = await fetch(url);
        const resp_json = await resp.json();
        window.console.log(resp_json);

        // Update the container values
        if (this.relations == null) {
          this.relations = [];
          this.relation_ids = [];
        }
        resp_json.relations.forEach(rel => {
          if (!(rel.id in this.relation_ids)) {
            this.relation_ids.push(rel.id);
            rel.hashes = undefined;  // take up less space.
            this.relations.push(rel);
          } else {
            window.console.warn(`Relation id '${rel.id}' already exists.`);
          }
        });
        this.next_offset = resp_json.next_offset;

        // Decide whether to close the search box or not.
        if (this.relations.length > 0)
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
        if (this.relations == null)
          return false;
        if (this.relations.length === 0)
          return true;
        return false
      },

      base_list: function() {
        return this.relations;
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
</style>