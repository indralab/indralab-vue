<template>
  <div class="statement">
    <div class="row clickable" @click="toggleList">
      <div class="col text-left">
        <h4>
          <span v-html='english'></span>
          <small v-if="!sources"
                 class='badge badge-secondary badge-pill'>
            {{ evidence.length }}
          </small>
          <small v-if='total_curations'
                 class='badge badge-success badge-pill'>
            &#9998; {{ total_curations }}
          </small>
        </h4>
      </div>
      <div class="col-auto text-right" v-if="sources">
        <source-display :source_counts="sources"></source-display>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="container">
          <div class='ev-list' v-show='show_list'>
            <evidence v-for='ev in list_shown'
                      :key='ev.source_hash'
                      v-bind='ev'
                      :stmt_hash='hash'/>
            <div class='text-center clickable'
                 v-show='show_buttons || ( loadable && !loaded)'
                 @click='loadMore'>
              Load {{ loaded ? next_batch : '' }} more...
            </div>
            <div class='text-center clickable'
                 v-show='show_buttons'
                 @click='loadAll'>
              Load all {{ base_list.length - end_n }} remaining...
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import expander_mixin from '../expander_mixin';
  import piecemeal_mixin from '../piecemeal_mixin'

  export default {
    name: "Statement",
    props: {
      evidence: Array,
      english: String,
      hash: String,
      sources: Object,
      loadable: {
        type: Boolean,
        default: false,
      }
    },
    data: function() {
      return {
        searching: false,
        loaded: false,
        loaded_evidence: null
      }
    },
    methods: {
      getMore: async function() {
        /**
         * Get more evidence for this statement (e.g. hash)
         */
        if (this.searching || this.loaded)
          return false;

        this.searching = true;

        let params = [
          'format=json-js',
        ];

        const resp = await fetch(this.$stmt_hash_url + this.hash
                + '?' + params.join('&'));
        const resp_json = await resp.json();
        window.console.log(resp_json);

        this.loaded_evidence = resp_json.statements[this.hash].evidence;
        this.loaded = true;

        this.searching = false;
        return true;
      }
    },
    computed: {
      base_list: function() {
        if (this.loaded_evidence)
          return this.loaded_evidence;
        else
          return this.evidence;
      },
      total_curations: function() {
        let total_curations = 0;
        for (let ev_id in this.evidence.slice(0, this.end_n)) {
          total_curations += this.evidence[ev_id].num_curations > 0;
        }
        return total_curations;
      },
    },
    mixins: [expander_mixin, piecemeal_mixin]
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
  }
  .clickable:hover {
    background-color: #e0e0e9;
  }

</style>