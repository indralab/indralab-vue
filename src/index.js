import * as ilComponents from './components'

const install = (Vue) => {
  Object.values(ilComponents).forEach(comp => {
    window.console.log("Indralab Vue Installing " + ilComponents.name);
    Vue.use(comp);
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
