<template>
  <span class="ref-link">
    <span v-if="best_ref.link">
      <a :href="best_ref.link"
         @mouseover="getLinkTitle(best_ref.type)"
         :title="texts[best_ref.type]"
         target="_blank">
        {{ best_ref.label }}
      </a>
    </span>
    <span v-else>
      <span :title="best_ref.id">
        {{ best_ref.label }}
      </span>
    </span>
  </span>
</template>

<script>
  export default {
    name: "RefLink",
    props: {
      text_refs: Object,
    },
    data: function() {
      return {
        titles: {}
      }
    },
    methods: {
      getHrefUrl: function(ref_id, ref_type) {
        if (!ref_id)
            return "";

        let link;
        switch (ref_type.toUpperCase()) {
            case 'PMID':
                link = "https://www.ncbi.nlm.nih.gov/pubmed/" + ref_id;
                break;
            case 'PMCID':
                link = "https://www.ncbi.nlm.nih.gov/pmc/articles/" + ref_id;
                break;
            case 'DOI':
                link = "https://dx.doi.org/" + ref_id;
                break;
            default:
                link = "";
                break;
        }
        return link;
      },

      getLinkTitle: async function (ref_type) {
        if (this.titles)
            return;
        let id, db;
        const entrez_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
        this.titles[ref_type] = "Loading...";
        switch (ref_type.toUpperCase()) {
            case 'PMID':
                id = this.text_refs[ref_type];
                db = 'pubmed';
                break;
            case 'PMCID':
                id = this.text_refs[ref_type].slice(3,);
                db = 'pmc';
                break;
            default:
                this.titles = `Cannot retrieve titles for ${ref_type}'s.`;
                return;
        }
        let url = `${entrez_url}?id=${id}&retmode=json&db=${db}`;
        const resp = await fetch(url, {method: 'POST'});
        const data = await resp.json();
        const pmd = data.result[id];
        let auth_str = '';
        let n = 0;
        if (pmd.authors)
          for (let author of pmd.authors) {
              if (n > 2) {
                  auth_str += ', ...';
                  break;
              }
              auth_str += author.name;
              if (n < pmd.authors.length) {
                  auth_str += ', ';
              }
              n += 1;
          }
        this.titles[ref_type] = `${auth_str}, "${pmd.title}", ${pmd.source}, ${pmd.pubdate}`;
      }
    },
    computed: {
      best_ref: function() {
        // Choose the best ref type available
        const ref_type_order = ['PMID', 'PMCID', 'DOI', null];
        let best_ref_type = null;
        let href;
        for (best_ref_type of ref_type_order)
          if (best_ref_type in this.text_refs) {
            href = this.getHrefUrl(this.text_refs[best_ref_type], best_ref_type);
            if (href)
              break;
          }
        return {
            link: href,
            label: this.text_refs[best_ref_type],
            type: best_ref_type,
            id: this.text_refs[best_ref_type]
          }
      },

      texts: function() {
        const texts = {};
        Object.entries(this.titles).forEach((ref_type, text) => {
          if (text)
            texts[ref_type] = text;
          else
            texts[ref_type] = "Hover to see info.";
        });
        return texts;
      }
    }
  }
</script>

<style scoped>
a {
  color: #256DC5;
}
</style>