import * as ilComponents from './components'

const install = (vue) => {
  Object.values(ilComponents).forEach(comp => {
    window.console.log("Indralab Vue Installing " + comp.name);
    vue.use(comp);
  })
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default install

export {default as Statement} from './components/Statement'
export {default as Evidence} from './components/Evidence'
export {default as RefLink} from './components/RefLink'
export {default as CurationRow} from './components/CurationRow'
export {default as AgentSelect} from './components/AgentSelect'
export {default as TypeSelect} from './components/TypeSelect'
export {default as MeshSelect} from './components/MeshSelect'
export {default as PaperSelect} from './components/PaperSelect'
export {default as RelationSearch} from './components/RelationSearch'
export {default as Relation} from './components/Relation'
export {default as SourceDisplay} from './components/SourceDisplay'