<template>
  <div class='container evidence'>
    <hr>
    <div class='row'>
      <div class='col-1'>
        <div class='row'>
          <div class='col-3 nvp clickable text-center'
               :class="{ 'has-curation-badge': num_curations }"
               v-on:click='toggleCuration'
               :title='num_curations'>
            &#9998;
          </div>
          <div class='col-9 nvp src-api'>
            {{ source_api }}
          </div>
        </div>
      </div>
      <div class='col-10' v-html='text'></div>
      <div class='col-1 text-right'>
        <ref-link :text_refs="text_refs"></ref-link>
      </div>
    </div>
    <div class='row'>
      <div class='col'>
        <curation-row :open='curation_shown' :stmt_hash='stmt_hash'
                      :source_hash='source_hash'/>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Evidence",
    props: {
        text: String,
        pmid: String,
        source_api: String,
        text_refs: Object,
        num_curations: Number,
        source_hash: String,
        stmt_hash: String
    },
    data: function() {
        return {
            curation_shown: false
        }
    },
    methods: {
        toggleCuration: function () {
            this.curation_shown = !this.curation_shown
        }
    }
  }
</script>

<style scoped>

</style>