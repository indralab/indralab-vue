<template>
  <div class='stmt_search'>
    <div id='seach-box' v-show='show_search'>
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
        <button @click='search'>Search</button>
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
        show_search: true
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

      search: async function() {
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
        let url = `${this.$search_url}?limit=50&${query_str}`;
        window.console.log(url);
        const resp = await fetch(url);
        this.relations = await resp.json();

        // Decide whether to close the search box or not.
        if (this.relations.length > 0)
          this.show_search = false;
      },
    },
    computed: {
      empty_relations: function() {
        if (this.relations === null)
          return false;
        if (this.relations.length === 0)
          return true;
        return false
      },

      base_list: function() {
        return this.relations;
      }
    },
    created: function() {
      this.addAgent();
    },
    mixins: [piecemeal_mixin]
  }
</script>

<style scoped>

</style>