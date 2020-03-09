<template>
  <span class="relation">
    <div class="row header"
         :style="`cursor: ${(searching) ? 'progress': 'pointer'};`"
         @click="toggleStmts">
      <div class='col text-left'>
        <h4>
          <span v-html="english"></span>
          <small v-if='cur_count'
                 class='badge badge-success badge-pill'>
            &#9998; {{ cur_count }}
          </small>
        </h4>
      </div>
      <div class="col-auto text-right">
        <source-display :source_counts="source_counts"></source-display>
      </div>
    </div>
    <div class="error-message" v-show="search_failed">
      <i style="color: red">Failed to find statements: {{search_failed}}</i>
    </div>
    <div class="row stmt_list" v-show="show_stmts">
      <div class="col">
        <div class="container">
          <statement v-for="(stmt, hash) in stmts"
                     :key="hash"
                     :english="stmt.english"
                     :hash="hash"
                     :loadable="true"
                     :sources="stmt_source_counts[hash]"
                     :num_curations="cur_counts[hash]"
                     :evidence="stmt.evidence"
                     :total_evidence="evidence_totals[hash]"
                     :init_expanded="Object.keys(stmts).length === 1"></statement>
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
      type: String,
      cur_count: {
        type: Number,
        default: 0
      }
    },
    data: function() {
      return {
        show_stmts: false,
        stmts: null,
        stmt_source_counts: null,
        searching: false,
        next_offset: 0,
        cur_counts: null,
        evidence_totals: null,
        search_failed: null,
      }
    },
    methods: {
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
        query_strs.push("with_cur_counts=true");
        query_strs.push("strict=true");

        const resp = await fetch(this.$stmt_url + '?' + query_strs.join('&'));
        let success = true;
        if (resp.status === 200) {
          const resp_json = await resp.json();
          window.console.log(resp_json);

          this.stmts = resp_json.statements;
          this.stmt_source_counts = resp_json.source_counts;
          this.next_offset = resp_json.offset + resp_json.statements_returned;
          this.cur_counts = resp_json.num_curations;
          this.evidence_totals = resp_json.evidence_totals;
          this.search_failed = null;
        } else {
          this.search_failed = `(${resp.status}) ${resp.statusText}`
          success = false;
        }
        this.searching = false;
        return success;
      }
    },
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