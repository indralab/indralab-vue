<template>
  <span class="relation">
    <div class="row header"
         :style="`cursor: ${(searching) ? 'progress': 'pointer'};`"
         @click="toggleStmts">
      <div class='col text-left'>
        <h4 v-html="english"></h4>
      </div>
      <div class="col text-right">
        <span v-for="(src_group, cat, idx) in sources" :key="cat">
          <span v-if="idx > 0" class="badge badge-source">|</span>
          <span v-for="src in src_group"
                :key="src">
            <span class='badge badge-source'
                  v-if="src in source_counts"
                  :title="src"
                  :class="srcBadge(src)">
              {{ source_counts[src] }}
            </span>
          </span>
        </span>
      </div>
    </div>
    <div class="row stmt_list" v-show="show_stmts">
      <div class="col">
        <div class="container nvm">
          <statement v-for="stmt in stmts"
                     :key="stmt.hash"
                     :english="stmt.english"
                     :hash="stmt.hash"
                     :evidence="stmt.evidence"></statement>
        </div>
      </div>
    </div>
  </span>
</template>

<script>
  const snowflakes = [
    'Complex',
    'Translocation',
    'ActiveForm',
    'Conversion',
    'Autophosphorylation'
  ];

  export default {
    name: "Relation",
    props: {
      english: String,
      source_counts: Object,
      agents: Object,
      type: String
    },
    data: function() {
      return {
        show_stmts: false,
        stmts: null,
        searching: false,
        next_offset: 0,
      }
    },
    methods: {
      srcBadge: function(src) {
        return `source-${src}`
      },

      toggleStmts: function() {
        if (this.stmts == null)
          this.getStmts();
        this.show_stmts = !this.show_stmts;
      },

      getStmts: async function() {
        if (this.searching)
          return false;

        window.console.log("Getting statements.");
        this.searching = true;

        let query_strs = [];
        for (let [idx, ag] of Object.entries(this.agents)) {
          if (snowflakes.includes(this.type))
            query_strs.push(`agent${idx}=${ag}@NAME`);
          else
            query_strs.push(`${['subject', 'object'][idx]}=${ag}@NAME`);
        }

        query_strs.push(`type=${this.type}`);
        query_strs.push("max_stmts=50");
        query_strs.push("ev_limit=10");
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push("format=json-js");
        query_strs.push("with_english=true");

        const resp = await fetch(this.$stmt_url + '?' + query_strs.join('&'));
        const resp_json = await resp.json();
        window.console.log(resp_json);

        this.stmts = Object.values(resp_json.statements);
        this.next_offset = resp_json.offset;

        this.searching = false;
        return true;
      }
    },
    computed: {
      sources: function() {
        return this.$sources;
      }
    }
  }
</script>

<style scoped>
  .header {
    cursor: pointer;
  }
  .header:hover {
    background-color: #e0e0e9;
  }
</style>