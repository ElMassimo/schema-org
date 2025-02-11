import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import type { SchemaOrgVuePlugin } from '@vueuse/schema-org'
import { injectSchemaOrg } from '#vueuse/schema-org/runtime'

type Arrayable<T> = T | Array<T>

let vmGlobalUid = -1

export function useSchemaOrg(input: Arrayable<any>) {
  // make sure we can get client
  const client = injectSchemaOrg() as SchemaOrgVuePlugin
  if (!client)
    return

  const vm = getCurrentInstance()
  const vmUid = vm?.uid || ++vmGlobalUid
  // try and set the appropriate context ID, so we can dedupe and cleanup
  client.ctx._ctxUid = vmUid
  // add the input to our schema graph
  client.ctx.addNode(input)

  // SSR Mode does not need to do anything else.
  if (typeof window === 'undefined') {
    nextTick(() => {
      watch(() => input, async () => {
        await client.forceRefresh()
      }, {
        immediate: true,
        deep: true,
      })
    })
    return
  }

  const stopWatcher = watch(() => input, () => {
    client.generateSchema()
  }, {
    deep: true,
  })

  // @todo initial state will be correct from server, only need to watch for route changes to re-compute

  // CSR Mode will need to manually trigger the schema to re-generate
  onMounted(() => {
    client.forceRefresh()
  })

  onBeforeUnmount(() => {
    client.removeContext(vmUid)
    client.generateSchema()
    stopWatcher()
  })
}
