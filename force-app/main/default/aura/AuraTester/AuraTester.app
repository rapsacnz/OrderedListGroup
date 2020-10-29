<aura:application extends="force:slds" implements="flexipage:availableForAllPageTypes,flexipage:availableForRecordHome,force:hasRecordId,force:appHostable" access="global"  >
  <aura:attribute name="leftValues" type="Object[]" default="[{
    'label': 'Lead Identified',
    'value': 'Lead Identified',
    'byline': 'we have an email address'
  },
  {
    'label': 'Initial Contact',
    'value': 'Initial Contact',
    'byline': 'call or email has occurred'
  },
  {
    'label': 'Discussions',
    'value': 'Discussions',
    'byline': 'we are engaged in a dialogue'
  },
  {
    'label': 'Verbal Agreement',
    'value': 'Verbal Agreement',
    'byline': 'things are looking good!'
  },
  {
    'label': 'Signed Contract',
    'value': 'Signed Contract',
    'byline': 'ring the bell my friends!'
  },
  {
    'label': 'No Further Action',
    'value': 'No Further Action',
    'byline': 'looks like a no go'
  }]"/>

  <lightning:card class="slds-p-around_medium">
  <c:orderedListGroup leftValues="{!v.leftValues}" field-name="Lead Stage"></c:orderedListGroup>
  </lightning:card>
</aura:application>