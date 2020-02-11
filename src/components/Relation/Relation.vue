<template>
  <div class="row relation">
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
</template>

<script>
  export default {
    name: "Relation",
    props: {
      english: String,
      source_counts: Object,
      agents: Object,
      type: String
    },
    methods: {
      srcBadge: function(src) {
        return `source-${src}`
      },
    },
    computed: {
      sources: function() {
        return this.$sources;
      }
    }
  }
</script>

<style scoped>

</style>