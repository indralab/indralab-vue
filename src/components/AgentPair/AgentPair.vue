<template>
  <span class="agent-pair">
    <div class="row header"
         :style="`cursor: ${(searching) ? 'progress': 'pointer'};`"
         @click="toggleRelations">
      <div class='col text-left'>
        <h5>
          <span v-html="english"></span>
          <small v-if='cur_count'
                 class='badge badge-success badge-pill'>
            &#9998; {{ cur_count }}
          </small>
        </h5>
      </div>
      <div class="col-auto text-right">
        <source-display :source_counts="source_counts"></source-display>
      </div>
    </div>
    <div class="error-message" v-show="search_failed">
      <i style="color: red">Failed to find statements: {{search_failed}}</i>
    </div>
    <div class="row stmt_list" v-show="show_relations">
      <div class="col">
        <div class="container right-bar">
          <span v-for="relation in relations" :key="relation.id">
            <relation v-bind="relation"></relation>
          </span>
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
    name: "AgentPair",
    props: {
      english: String,
      source_counts: Object,
      agents: Object,
      cur_count: {
        type: Number,
        default: 0
      }
    },
    data: function() {
      return {
        show_relations: false,
        relations: null,
        stmt_source_counts: null,
        searching: false,
        next_offset: 0,
        cur_counts: null,
        evidence_totals: null,
        search_failed: null,
      }
    },
    methods: {
      toggleRelations: function() {
        if (this.relations == null)
          this.getRelations();
        this.show_relations = !this.show_relations;
      },

      getRelations: async function() {
        if (this.searching)
          return false;

        window.console.log("Getting relations.");
        this.searching = true;

        let query_strs = [];
        let tagged_ag;
        for (let [idx, ag] of Object.entries(this.agents)) {
          tagged_ag = encodeURIComponent(`${ag}@NAME`);
          if (snowflakes.includes(this.type))
            query_strs.push(`agent${idx}=${tagged_ag}`);
          else
            query_strs.push(`${['subject', 'object'][idx]}=${tagged_ag}`);
        }

        query_strs.push("max_stmts=50");
        query_strs.push(`offset=${this.next_offset}`);
        query_strs.push("with_english=true");
        query_strs.push("with_cur_counts=true");
        query_strs.push("strict=true");

        const resp = await fetch(this.$relation_url + '?' + query_strs.join('&'));
        let success = true;
        if (resp.status === 200) {
          const resp_json = await resp.json();
          window.console.log(resp_json);

          this.relations = resp_json.results;
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
  .right-bar {
    border-right: #0d5aa7 solid 1px;
  }
</style>