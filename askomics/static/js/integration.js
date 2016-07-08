/*jshint esversion: 6 */
/**
 * Register event handlers for integration
 */
$(function () {

    // Generate preview data
    $("#content_integration").on('change', '.toggle_column', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkExistingData(block);
    });

    $("#content_integration").on('change', '.column_type', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            previewTtl(block);
        }
        checkExistingData(block);
    });

    $("#content_integration").on('click', '.preview_button', function(event) {
        var block = $(event.target).closest('.template-source_file');
        if (block.find('.preview_field').is(':visible')) {
            hidePreview(block);
        }else{
            previewTtl(block);
        }
    });

    $("#content_integration").on('click', '.load_data', function(event) {
        loadSourceFile($(event.target).closest('.template-source_file'));
    });
});

/**
 * Transform an array of column content to an array of row content
 */
function cols2rows(items) {
    var out = [];

    for(var i=0, l=items.length; i<l; i++) {
        for(var j=0, m=items[i].length; j<m; j++) {
            if (!(j in out))  {
                out[j] = [];
            }
            out[j][i] = items[i][j];
        }
    }

    return out;
}

/**
 * Show preview data on the page
 */
function displayTable(data) {
    // Transform columns to rows
    var i;
    for(i=0, l=data.files.length; i<l; i++) {
        if ('preview_data' in data.files[i]) {
            data.files[i].preview_data = cols2rows(data.files[i].preview_data);
        }
    }

    // display received data
    var template = $('#template-source_file-preview').html();

    var templateScript = Handlebars.compile(template);
    var html = templateScript(data);

    $("#content_integration").html(html);

    // Select the correct type for each column
    for(i=0, l=data.files.length; i<l; i++) {

        if ('column_types' in data.files[i]) {

            var cols = data.files[i].column_types;
            for(var j=0, m=cols.length; j<m; j++) {
                var selectbox = $('div#content_integration form.template-source_file:eq(' + i + ') select.column_type:eq(' + j + ')');
                var values = selectbox.find("option").map(function() { return $(this).val(); });

                if ($.inArray(cols[j], ['start', 'end', 'numeric']) == -1) {
                    $.each(['start', 'end', 'numeric'], function( index, value ) {
                        selectbox.find("option[value="+value+"]").hide();
                    });
                }

                if ($.inArray( cols[j], values) >= 0) {
                    selectbox.val(cols[j]);
                }

                // Check what is in the db
                checkExistingData($('div#content_integration form.template-source_file:eq(' + i + ')'));
            }
        }
    }
}

/**
 * Get ttl representation of preview data
 */
function previewTtl(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    var service = new RestServiceJs("preview_ttl");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns };

    service.post(model, function(data) {
        file_elem.find(".preview_field").html(data);
        file_elem.find(".preview_field").show();
    });
}

function hidePreview(file_elem) {
    var file_name = file_elem.find('.file_name').text();
    file_elem.find(".preview_field").hide();
}

// Function to find if array contain all values of a list

function containAll(Array1,Array2){
    for(var i = 0 , len = Array2.length; i < len; i++){
        if($.inArray(Array2[i], Array1) == -1) {
            return false;
        }
    }
    return true;
}

// Function to find if array contain any values of a list

 function containAny(Array1,Array2){
    for(var i = 0 , len = Array2.length; i < len; i++){
        if($.inArray(Array2[i], Array1) != -1) {
            return true;
        }
    }
    return false;
}

/**
 * Compare the user data and what is already in the triple store
 */
function checkExistingData(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // check if all positionable attributes are set
    var warning_elem = file_elem.find(".warning-message").first();

    if (containAll(col_types,['start', 'end', 'ref', 'taxon'])) {//positionable entity with all attributes
        warning_elem.html("").removeClass("show").addClass("hidden");
    }else{
        if (containAny(col_types,['start', 'end', 'ref', 'taxon'])) { //positionable entity with missing attributes
            warning_elem.html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> Missing positionable attributes for '+file_name)
                                .removeClass('hidden')
                              .addClass("show alert alert-danger");
        }else{ //not a positionable entity
            warning_elem.html("").removeClass("show").addClass("hidden");
        }
    }

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    var service = new RestServiceJs("check_existing_data");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns };

    service.post(model, function(data) {
        file_elem.find('.column_header').each(function( index ) {
            if (data.headers_status[index-1] == 'present') {
                $(this).find(".relation_present").first().show();
                $(this).find(".relation_new").first().hide();
            }
            else {
                $(this).find(".relation_present").first().hide();
                $(this).find(".relation_new").first().show();
            }
        });

        var insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.missing_headers.length > 0) {
            insert_warning_elem.html("<strong>The following columns are missing:</strong> " + data.missing_headers.join(', '))
                              .removeClass("hidden alert-success")
                              .removeClass("hidden alert-danger")
                              .addClass("show alert-warning");
        }
    });
}

/**
 * Load a source_file into the triplestore
 */
function loadSourceFile(file_elem) {

    var file_name = file_elem.find('.file_name').text();

    // Get column types
    var col_types = file_elem.find('.column_type').map(function() {
        return $(this).val();
    }).get();

    // Find which column is disabled
    var disabled_columns = [];
    file_elem.find('.toggle_column').each(function( index ) {
        if (!$(this).is(':checked')) {
            disabled_columns.push(index + 1); // +1 to take into account the first non-disablable column
        }
    });

    displayModal('Please wait', '', 'Close');

    var service = new RestServiceJs("load_data_into_graph");
    var model = { 'file_name': file_name,
                  'col_types': col_types,
                  'disabled_columns': disabled_columns  };

    console.log('---> col_types: '+col_types);

    service.post(model, function(data) {
        hideModal();
        var insert_status_elem = file_elem.find(".insert_status").first();
        var insert_warning_elem = file_elem.find(".insert_warning").first();
        if (data.status != "ok") {
            insert_warning_elem.html('<span class="glyphicon glyphicon glyphicon-exclamation-sign"></span>')
                              .append(data.error);
            if ('url' in data) {
                insert_warning_elem.append("<br>You can view the ttl file here: <a href=\""+data.url+"\">"+data.url+"</a>");
            }
            insert_status_elem.removeClass('hidden alert-success')
                              .addClass('show alert-danger');
        }
        else {
            insert_status_elem.html('<strong><span class="glyphicon glyphicon-ok"></span> Success:</strong> inserted '+ data.total_triple_count + " lines")
                              .addClass('show alert-success')
                              .removeClass('hidden alert-danger');
        }

        // Check what is in the db now
        $('.template-source_file').each(function( index ) {
            checkExistingData($(this));
        });
    });
}
