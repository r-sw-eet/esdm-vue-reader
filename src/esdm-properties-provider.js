import { TextFieldEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel'
import { useService } from 'bpmn-js-properties-panel'
import { is } from 'bpmn-js/lib/util/ModelUtil'

function FeelGuardEntry(props) {
  const { element, id } = props
  const modeling = useService('modeling')
  const bpmnFactory = useService('bpmnFactory')
  const debounce = useService('debounceInput')

  const getValue = () => (element.businessObject.conditionExpression && element.businessObject.conditionExpression.body) || ''
  const setValue = (value) => {
    const conditionExpression = value
      ? bpmnFactory.create('bpmn:FormalExpression', { body: value })
      : undefined
    modeling.updateProperties(element, { conditionExpression })
  }

  return TextFieldEntry({
    id,
    element,
    label: 'FEEL guard',
    description: 'A FEEL condition — becomes an admits[].when guard (0002). e.g. paidAmount >= total',
    getValue,
    setValue,
    debounce,
  })
}

function feelGroup(element) {
  return {
    id: 'esdm-feel',
    label: 'ESDM rule (FEEL)',
    entries: [{ id: 'esdm-feel-guard', component: FeelGuardEntry, isEdited: isTextFieldEntryEdited }],
  }
}

class EsdmPropertiesProvider {
  constructor(propertiesPanel) {
    propertiesPanel.registerProvider(500, this)
  }
  getGroups(element) {
    return (groups) => {
      if (is(element, 'bpmn:SequenceFlow')) {
        groups.push(feelGroup(element))
      }
      return groups
    }
  }
}
EsdmPropertiesProvider.$inject = ['propertiesPanel']

export default {
  __init__: ['esdmPropertiesProvider'],
  esdmPropertiesProvider: ['type', EsdmPropertiesProvider],
}