var oldRecord = new GlideRecord('x_421393_facilitie_facilities_request');
// oldRecord.addQuery('number', 'FAC0002094');
oldRecord.addQuery('active', 'true');
// oldRecord.setLimit(5);
oldRecord.query();

var categories = ["Facilities - Exterior", "Facilities - Interior"];

// integer values of priorities which map to the same value in FSM
var priorities = [1, 2, 3];

// Transfer all journal fields from one glide record to another
function copyNotes(oldRecord, WO_sys_id) {
    var oldNotes = new GlideRecord('sys_journal_field');
    oldNotes.addQuery("element_id", oldRecord.getUniqueValue());
    oldNotes.query();

    var audit = new GlideRecord("sys_audit");
    audit.addEncodedQuery("fieldname=work_notes^ORfieldname=comments^ORfieldname=assigned_to^ORfieldname=state^ORfieldname=u_assigned_vendor^ORfieldname=priority^ORfieldname=closed_by")
    audit.addQuery("documentkey", oldRecord.getUniqueValue());
    audit.query();

    // working way to get work notes
    while (oldNotes.next()) {
        var note = new GlideRecord('sys_journal_field');
        note.initialize();

        var newAudit = new GlideRecord("sys_audit");
        newAudit.initialize();

        for (prop in oldNotes) {
            if (prop == 'name') {
                note.setValue(prop, 'wm_order');
            }
            else if (prop == 'element_id') {
                note.setValue(prop, WO_sys_id);
            }
            else {
                note.setValue(prop, oldNotes.getValue(prop));
            }
        }
        while (audit.next()) {

            for (prop in audit) {
                if (prop == 'tablename') { // was "name"
                    newAudit.setValue(prop, 'wm_order');
                }
                else if (prop == 'documentkey') {
                    newAudit.setValue(prop, WO_sys_id);
                }
                else {
                    newAudit.setValue(prop, audit.getValue(prop));
                }
            }
            newAudit.setWorkflow(false);
            newAudit.autoSysFields(false);
            newAudit.insert();
        }
        note.setWorkflow(false);
        note.autoSysFields(false);
        note.insert();
    }
}

function copyEmails(oldRecord, WO_sys_id) {
    var email = new GlideRecord('sys_email');
    email.addQuery("instance", oldRecord.getUniqueValue());
    email.addQuery("target_table", 'x_421393_facilitie_facilities_request');
    email.query();

    while (email.next()) {
        var newEmail = new GlideRecord('sys_email');
        newEmail.initialize();

        for (prop in email) {
            if (prop == 'target_table') { //table name
                newEmail.setValue(prop, 'wm_order');
            }
            else if (prop == 'instance') { // sys_id of record
                newEmail.setValue(prop, WO_sys_id);
            }
            else {
                newEmail.setValue(prop, email.getValue(prop));
            }
        }
        newEmail.setWorkflow(false);
        newEmail.autoSysFields(false);
        newEmail.insert();
    }
}

while (oldRecord.next()) {

    var newRecord = new GlideRecord('wm_order');

    // initialize (create, without saving) a new record
    newRecord.initialize();
    newRecord.setWorkflow(false);

    // set category
    if (oldRecord.u_category == "exterior") {
        newRecord.category = categories[0];
    } else {
        newRecord.category = categories[1];
    }

    // check, then assign corresponding priority value to new record
    var priorityValue = parseInt(oldRecord.priority)

    if (priorities.indexOf(priorityValue) > -1) {
        newRecord.priority = oldRecord.priority;
    } else if (priorityValue == 6) {
        newRecord.priority = 30;
    } else if (priorityValue == 7) {
        newRecord.priority = 60;
    } else if (priorityValue == 8 || priorityValue == 5) { // good
        newRecord.priority = 61;
    } else if (priorityValue == 4) {
        newRecord.priority = 5
    }

    // get current state, then map to the appropriate state and substates
    var stateValue = parseInt(oldRecord.state);
    switch (stateValue) {
        case 3: // "Cancel - Future Refresh Program"
            newRecord.state = 7; // "Cancelled"
            newRecord.u_fac_suspend_reason = "included in capex project";
            break;

        case 4: // "Closed":
            newRecord.state = 3; // "Closed Complete"
            newRecord.u_fac_suspend_reason = "invoiced";
            break;

        case 13: // "Completed - Awaiting Invoice"
            newRecord.state = 3; // "Closed Complete"
            newRecord.u_fac_suspend_reason = "waiting on invoice";
            break;

        case 7: // "Duplicate - Closed"
            newRecord.state = 7; // "Cancelled"
            newRecord.u_fac_suspend_reason = "duplicate request";
            break;

        case 12: // "Hold"
            newRecord.state = 19; // "On Hold"
            newRecord.u_fac_suspend_reason = "facilities action required";
            break;

        case 5: // "Hold - for Future Capex"
            newRecord.state = 19; // "On Hold"
            newRecord.u_fac_suspend_reason = "waiting on cer approval";
            break;

        case 6: // "Hold - Per Property Dept"
            newRecord.state = 19; // "On Hold"
            newRecord.u_fac_suspend_reason = "facilities action required";
            break;

        case 1: // "Open"
            newRecord.state = 16; // "Assigned"
            newRecord.u_fac_suspend_reason = "-- None --";
            break;

        case 11: // "Parts on order"
            newRecord.state = 18; // "Work in Progress"
            newRecord.u_fac_suspend_reason = "parts on order";
            break;

        case -5: // "Pending approval"
            newRecord.state = 19; // "On Hold"
            newRecord.u_fac_suspend_reason = 'waiting on opex approval'
            break;

        case 400: // "Pending Branch"
            newRecord.state = 16; // "Assigned"
            newRecord.u_fac_suspend_reason = "additional_Info_required";
            break;

        case 8: // "Pending CER approval"
            newRecord.state = 19; // "On Hold"
            newRecord.u_fac_suspend_reason = "waiting on cer approval";
            break;

        case 2: // "Pending Vendor"
            newRecord.state = 16; // "Assigned"
            newRecord.u_fac_suspend_reason = "dispatched to vendor";
            break;

        case 9: // "Scheduled"
            newRecord.state = 18; // "Work in Progress"
            newRecord.u_fac_suspend_reason = "accepted by vendor";
            break;

        case 10: // "Waiting on Proposal"
            newRecord.state = 18; // "Work in Progress"
            newRecord.u_fac_suspend_reason = "waiting on proposal";
            break;

        default:
            newRecord.state = 16; // "Assigned"
            newRecord.u_fac_suspend_reason = "-- None --";
            break;
    }

    // get current job type (subcategory) and map it to the appropriate value
    var subcat = oldRecord.u_job_type.toString();

    switch (subcat) {
        case "appliances - need new":
            newRecord.setValue("subcategory", "appliances - need new (describe type)");
            break;

        case "bollards or parking lot stops":
            newRecord.setValue("subcategory", "bollards (install)");
            break;

        case "building damage":
            newRecord.setValue("subcategory", "building damage");
            break;

        case "burg-camera":
            newRecord.setValue("subcategory", "burg-camera")
            break;

        case "carpet damage or replacement":
            newRecord.setValue("subcategory", "carpet -  damage or replacement");
            break;

        case "cleaning - new service":
            newRecord.setValue("subcategory", "cleaning – new service");
            break;

        case "cleaning - warehouse":
            newRecord.setValue("subcategory", "cleaning – warehouse");
            break;

        case "door - man door":
            newRecord.setValue("subcategory", "door - man door");
            break;

        case "door - overhead door":
            newRecord.setValue("subcategory", "door - overhead door");
            break;

        case "electric":
            newRecord.setValue("subcategory", "electrical");
            break

        case "exit/emergency lights and signs":
            newRecord.setValue("subcategory", "exit/emergency lights");
            break;

        case "exterior paint":
            newRecord.setValue("subcategory", "paint - exterior");
            break;

        case "first_aid_kit":
            newRecord.setValue("subcategory", "first aid - request new service");
            break;

        case "flooring - offices":
            newRecord.setValue("subcategory", "flooring – offices");
            break;

        case "flooring - warehouse":
            newRecord.setValue("subcategory", "flooring -warehouse");
            break;

        case "furniture - need new":
            newRecord.setValue("subcategory", "furniture - new/assembled")
            break;

        case "gas or propane storage cage":
            newRecord.setValue("subcategory", "gas or propane storage cage")
            break;

        case "gate/fencing":
            newRecord.setValue("subcategory", "gate/fencing");
            break;

        case "hvac - leak":
            newRecord.setValue("subcategory", "hvac - leak");
            break;

        case "hvac_pm":
            newRecord.setValue("subcategory", "hvac_pm");
            break;

        case "ice machine pm":
            newRecord.setValue("subcategory", "ice machine pm service");
            break;

        case "irrigation - damage":
            newRecord.setValue("subcategory", "irrigation - damage/repair");
            break;

        case "landscape":
            newRecord.setValue("subcategory", "landscape - general yard");
            break;

        case "lighting":
            newRecord.setValue("subcategory", "lighting");
            break;

        case "locksmith":
            newRecord.setValue("subcategory", "locksmith - door lock issue");
            break;

        case "locksmith or key":
            newRecord.setValue("subcategory", "locksmith - door lock issue");
            break;

        case "paint":
            newRecord.setValue("subcategory", "paint");
            break;

        case "parking lot (asphalt /sidewalk/concrete)":
            newRecord.setValue("subcategory", "parking lot (asphalt)");
            break;

        case "plumbing":
            newRecord.setValue("subcategory", "plumbing");
            break;

        case "racking":
            newRecord.setValue("subcategory", "racking");
            break;

        case "salt deployment":
            newRecord.setValue("subcategory", "snow - salt deployment");
            break;

        case "shed/carport/garage":
            newRecord.setValue("subcategory", "shed/carport/garage repair");
            break;

        case "snow/ice removal":
            newRecord.setValue("subcategory", "snow - ice removal");
            break;

        case "trees/shrub removal":
            newRecord.setValue("subcategory", "landscape - tree and shrub removal");
            break;

        case "water leak":
            newRecord.setValue("subcategory", "water leak");
            break;

        case "windows / glass break":
            newRecord.setValue("subcategory", "windows -  glass break");
            break;

        case "windows / glass break - board up needed":
            newRecord.setValue("subcategory", "windows- door glass break - board up needed");
            break;

        default:
            newRecord.setValue('subcategory', subcat);
            break;
    }

    // adding old FAC# to the Work Order form
    newRecord.u_fac_record = oldRecord.sys_id;

    // update new record fields
    newRecord.number = oldRecord.number; // Jessie said to keep the number
    newRecord.caller = oldRecord.u_requestor || oldRecord.caller;
    newRecord.u_alt_contact = oldRecord.u_alt_contact;
    newRecord.short_description = oldRecord.short_description;
    newRecord.description = oldRecord.description;
    newRecord.assignment_group = oldRecord.assignment_group;
    newRecord.assigned_to = oldRecord.assigned_to;
    newRecord.u_next_action_date = oldRecord.u_next_action_date;
    newRecord.opened_at = oldRecord.opened_at;
    newRecord.opened_by = oldRecord.opened_by;
    newRecord.assigned_vendor = oldRecord.u_assigned_vendor
    newRecord.u_customer_vendor_updated = oldRecord.u_customer_vendor_updated;
    newRecord.follow_up = oldRecord.follow_up;
    newRecord.location = oldRecord.u_branch;

    // impact matrix
    switch (oldRecord.getDisplayValue('u_business_impact')) {
        case 'Emergency - Unable to conduct business':
            newRecord.setValue('impact', 1);
            break;
        case 'Non-Emergency':
            newRecord.setValue('impact', 2);
            break;
        case 'Low Priority':
            newRecord.setValue('impact', 3);
            break;
    }

    // closed time stamp
    if (oldRecord.closed_at != '') {
        newRecord.closed_at = oldRecord.closed_at
    }

    // ensures that system-created fields are mirrored to the new record
    newRecord.sys_updated_by = oldRecord.sys_updated_by;
    newRecord.sys_updated_on = oldRecord.sys_updated_on;
    newRecord.sys_created_by = oldRecord.sys_created_by;
    newRecord.sys_created_on = oldRecord.sys_created_on;

    // allows manual override of the sys_* fields; otherwise will be overwritten by SNOW itself
    newRecord.autoSysFields(false);

    // insert record into table (i.e. save)
    var WO_sys_id = newRecord.insert(); // returns sys_id

    // copy attachment(s) from the old record to the new
    new GlideSysAttachment.copy('x_421393_facilitie_facilities_request', oldRecord.sys_id, 'wm_order', newRecord.sys_id);

    // update record with copied over attachments
    newRecord.update();

    // copy work notes from old record with time stamps and names of the person who wrote it
    copyNotes(oldRecord, WO_sys_id);

    copyEmails(oldRecord, WO_sys_id);

    // get history record for the new work order
    var history = new GlideRecord("sys_history_set");
    history.addQuery("id", WO_sys_id);
    history.query();

    // delete history record; it's recreated when the record is rendered
    while (history.next()) {
        history.deleteRecord();
    }
}
