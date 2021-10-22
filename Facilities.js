// begin query on the existing Facilities table
var oldRecord = new GlideRecord('x_421393_facilitie_facilities_request');

// add a query for inactive tickets
oldRecord.addQuery('number=FAC0002699');

oldRecord.query();

while(oldRecord.next()) {
    var newRecord = new GlideRecord('wm_order');
    
    // initialize a new record
    newRecord.initialize();

	// update new record fields
    newRecord.caller = oldRecord.u_requestor;
    newRecord.u_alt_contact = oldRecord.u_alt_contact;
    newRecord.short_description = oldRecord.short_description;
    newRecord.description = oldRecord.description;
    newRecord.assignment_group = oldRecord.assignment_group;
    newRecord.assigned_to = oldRecord.assigned_to;
    newRecord.u_next_action_date = oldRecord.u_next_action_date;
    newRecord.category = oldRecord.u_category;
    newRecord.opened_at = oldRecord.opened_at;
    newRecord.opened_by = oldRecord.opened_by;
    newRecord.impact = oldRecord.u_business_impact;

    // ensures that system-created fields are mirrored to the new record
    newRecord.sys_updated_by = oldRecord.sys_updated_by;
    newRecord.sys_updated_on = oldRecord.sys_updated_on;
    newRecord.sys_created_by = oldRecord.sys_created_by;
    newRecord.sys_created_on = oldRecord.sys_created_on;

    // allows manual override of the sys_* fields; otherwise will be overwritten by SNOW itself
    newRecord.autoSysFields(false);

	// insert record into table (i.e. save)
    newRecord.insert();

	// copy attachment(s) from the old record to the new
    new GlideSysAttachment.copy('x_421393_facilitie_facilities_request', oldRecord.sys_id, 'wm_order', newRecord.sys_id);

    // update record with copied over attachments
    newRecord.update();
}