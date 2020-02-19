<template>
  <div class='container evidence nvm'>
    <hr>
    <div class='row nvm'>
      <div class='col-1'>
        <div class='row'>
          <div class='col-3 nvm clickable text-center'
               :class="{ 'has-curation-badge': num_curations > 0 }"
               v-on:click='toggleCuration'
               :title='num_curations'>
            &#9998;
          </div>
          <div class='col-9 nvm src-api'>
            {{ source_api }}
          </div>
        </div>
      </div>
      <div class='col-10' v-html='always_text'></div>
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
    },
    computed: {
      always_text: function() {
        if (this.text)
          return this.text;
        else
          return '<i>No evidence text available.</i>'
      }
    }
  }
</script>

<style scoped>
  .src-api {
    overflow-x: hidden;
  }

  .has-curation-badge {
    background-color: #d3fccf;
    border-radius: 1em;
  }

  .clickable {
    cursor: pointer;
  }

  .clickable:hover {
    opacity: 60%;
  }
</style>