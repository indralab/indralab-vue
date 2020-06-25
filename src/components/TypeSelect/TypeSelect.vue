<template>
  <span class="type-select">
    <select class="form-control" v-model="selected_type">
      <option :value="null" selected disabled hidden>Select type...</option>
      <option v-for="type_name in type_options"
              :value="type_name"
              :key="type_name">
        {{ type_name }}
      </option>
    </select>
  </span>
</template>

<script>
  export default {
    name: "TypeSelect",
    props: ['value'],
    data: function() {
      return {
        type_options: this.$stmt_types,
        selected_type: null,
      }
    },
    computed: {
      constraint: function() {
        if (!this.selected_type)
          return null;
        return {stmt_types: [this.selected_type]}
      }
    },
    watch: {
      constraint: function(constraint) {
        this.$emit('input', constraint);
      }
    }
  }
</script>

<style scoped>
  .type-select {
    margin: 0.2em;
  }
  select, input, button {
    margin: 0.2em;
  }
  .label {
    margin-left: 0.5em;
    margin-right: 0.2em;
  }
</style>
