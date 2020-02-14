<template>
  <span class='agent-select'>
      <span v-if="!options || options_empty">
        <input class="form-control"
               type="text"
               v-model="agent_str"
               placeholder="Enter agent here">
        <button class="btn btn-primary" @click='lookupOptions'>Search Grounding</button>
        <span v-show='searching'>Searching...</span>
        <span v-show='options_empty'>No groundings found...</span>
      </span>
      <span v-else-if="options.length === 1">
        <span class='form-control' v-html="printOption(options[0])"></span>
        <button class="btn btn-primary"
                @click='resetOptions'>
            Cancel
        </button>
      </span>
      <span v-else>
        <select class="form-control" v-model='selected_option_idx'>
          <option :value='-1' selected disabled hidden>Select grounding option...</option>
          <option v-for='(option, option_idx) in options'
                  :key='option_idx'
                  :value='option_idx'
                  v-html="printOption(option)">
          </option>
        </select>
        <button class="btn btn-primary"
                @click='resetOptions'>
            Cancel
        </button>
      </span>
    </span>
</template>

<script>
  export default {
    name: "AgentSelect",
    props: ['value'],
    data: function() {
      return {
        agent_str: '',
        searching: false,
        options: null,
        selected_option_idx: -1,
      }
    },
    methods: {
      lookupOptions: async function() {
        this.searching = true;
        const resp = await fetch(
          `${this.$ground_url}?agent=${this.agent_str}`,
          {method: 'GET'}
          );
        this.options = await resp.json();
        this.searching = false;

        if (this.options.length === 1)
          this.selected_option_idx = 0;
      },
      resetOptions: function() {
        this.options = null;
        this.selected_option_idx = -1;
      },
      printOption: function(option) {
        let term = option.term;
        return `<b>${term.entry_name}</b> (score: ${option.score.toFixed(2)}, ${term.status} from ${term.source})`;
      }
    },
    computed: {
      options_empty: function() {
        if (!this.options)
          return false;
        return this.options.length === 0;
      }
    },
    watch: {
      selected_option_idx: function(selected_option_idx) {
        if (selected_option_idx < 0)
          this.$emit('input', null);
        else
          this.$emit('input', this.options[selected_option_idx]);
      }
    }
  }
</script>

<style scoped>
  button {
    margin: 0 0.5em;
  }
</style>