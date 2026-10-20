// Replace these prototype grants with permissions from the authenticated session.
export const defaultMessagePermissions = Object.freeze({edit:true,batchEdit:true,history:true,snapshot:true,questionnaire:true,export:true});
export function canMessage(permissions,action){return permissions?.[action]===true;}
