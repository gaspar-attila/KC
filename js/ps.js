(function($, task) {
"use strict";

function Events1() { // ps 

	function on_page_loaded(task) {
		
		$("title").text(task.item_caption);
		$("#title").text(task.item_caption);
		  
		if (task.safe_mode) {
			$("#user-info").text(task.user_info.role_name + ' ' + task.user_info.user_name);
			$('#log-out')
			.show() 
			.click(function(e) {
				e.preventDefault();
				task.logout();
			}); 
		}
	
		if (task.full_width) {
			$('#container').removeClass('container').addClass('container-fluid');
		}
		$('#container').show();
		
		task.create_menu($("#menu"), $("#content"), {
			// splash_screen: '<h1 class="text-center">Application</h1>',
			view_first: true
		});
	
		// $(document).ajaxStart(function() { $("html").addClass("wait"); });
		// $(document).ajaxStop(function() { $("html").removeClass("wait"); });
	} 
	
	function on_view_form_created(item) {
		var table_options_height = item.table_options.height,
			table_container;
	
		item.clear_filters();
		
		item.view_options.table_container_class = 'view-table';
		item.view_options.detail_container_class = 'view-detail';
		item.view_options.open_item = true;
		
		if (item.view_form.hasClass('modal')) {
			item.view_options.width = 1060;
			item.table_options.height = $(window).height() - 300;
		}
		else {
			if (!item.table_options.height) {
				item.table_options.height = $(window).height() - $('body').height() - 20;
			}
		}
		
		if (item.can_create()) {
			item.view_form.find("#new-btn").on('click.task', function(e) {
				e.preventDefault();
				if (item.master) {
					item.append_record();
				}
				else {
					item.insert_record();
				}
			});
		}
		else {
			item.view_form.find("#new-btn").prop("disabled", true);
		}
	
		item.view_form.find("#edit-btn").on('click.task', function(e) {
			e.preventDefault();
			item.edit_record();
		});
	
		if (item.can_delete()) {
			item.view_form.find("#delete-btn").on('click.task', function(e) {
				e.preventDefault();
				item.delete_record();
			});
		}
		else {
			item.view_form.find("#delete-btn").prop("disabled", true);
		}
		
		create_print_btns(item);
	
		task.view_form_created(item);
		
		if (!item.master && item.owner.on_view_form_created) {
			item.owner.on_view_form_created(item);
		}
	
		if (item.on_view_form_created) {
			item.on_view_form_created(item);
		}
		
		item.create_view_tables();
		
		if (!item.master && item.view_options.open_item) {
			item.open(true);
		}
	
		if (!table_options_height) {
			item.table_options.height = undefined;
		}
		return true;
	}
	
	function on_view_form_shown(item) {
		item.view_form.find('.dbtable.' + item.item_name + ' .inner-table').focus();
	}
	
	function on_view_form_closed(item) {
		if (!item.master && item.view_options.open_item) {	
			item.close();
		}
	}
	
	function on_edit_form_created(item) {
		item.edit_options.inputs_container_class = 'edit-body';
		item.edit_options.detail_container_class = 'edit-detail';
		
		item.edit_form.find("#cancel-btn").on('click.task', function(e) { item.cancel_edit(e) });
		item.edit_form.find("#ok-btn").on('click.task', function() { item.apply_record() });
		if (!item.is_new() && !item.can_modify) {
			item.edit_form.find("#ok-btn").prop("disabled", true);
		}
		
		task.edit_form_created(item);
		
		if (!item.master && item.owner.on_edit_form_created) {
			item.owner.on_edit_form_created(item);
		}
	
		if (item.on_edit_form_created) {
			item.on_edit_form_created(item);
		}
			
		item.create_inputs(item.edit_form.find('.' + item.edit_options.inputs_container_class));
		item.create_detail_views(item.edit_form.find('.' + item.edit_options.detail_container_class));
	
		return true;
	}
	
	function on_edit_form_close_query(item) {
		var result = true;
		if (item.is_changing()) {
			if (item.is_modified()) {
				item.yes_no_cancel(task.language.save_changes,
					function() {
						item.apply_record();
					},
					function() {
						item.cancel_edit();
					}
				);
				result = false;
			}
			else {
				item.cancel_edit();
			}
		}
		return result;
	}
	
	function on_filter_form_created(item) {
		item.filter_options.title = item.item_caption + ' - filters';
		item.create_filter_inputs(item.filter_form.find(".edit-body"));
		item.filter_form.find("#cancel-btn").on('click.task', function() {
			item.close_filter_form(); 
		});
		item.filter_form.find("#ok-btn").on('click.task', function() { 
			item.set_order_by(item.view_options.default_order);
			item.apply_filters(item._search_params); 
		});
	}
	
	function on_param_form_created(item) {
		item.create_param_inputs(item.param_form.find(".edit-body"));
		item.param_form.find("#cancel-btn").on('click.task', function() { 
			item.close_param_form();
		});
		item.param_form.find("#ok-btn").on('click.task', function() { 
			item.process_report();
		});
	}
	
	function on_before_print_report(report) {
		var select;
		report.extension = 'pdf';
		if (report.param_form) {
			select = report.param_form.find('select');
			if (select && select.val()) {
				report.extension = select.val();
			}
		}
	}
	
	function on_view_form_keyup(item, event) {
		if (event.keyCode === 45 && event.ctrlKey === true){
			if (item.master) {
				item.append_record();
			}
			else {
				item.insert_record();				
			}
		}
		else if (event.keyCode === 46 && event.ctrlKey === true){
			item.delete_record(); 
		}
	}
	
	function on_edit_form_keyup(item, event) {
		if (event.keyCode === 13 && event.ctrlKey === true){
			item.edit_form.find("#ok-btn").focus(); 
			item.apply_record();
		}
	}
	
	function create_print_btns(item) {
		var i,
			$ul,
			$li,
			reports = [];
		if (item.reports) {
			for (i = 0; i < item.reports.length; i++) {
				if (item.reports[i].can_view()) {
					reports.push(item.reports[i]);
				}
			}
			if (reports.length) {
				$ul = item.view_form.find("#report-btn ul");
				for (i = 0; i < reports.length; i++) {
					$li = $('<li><a href="#">' + reports[i].item_caption + '</a></li>');
					$li.find('a').data('report', reports[i]);
					$li.on('click', 'a', function(e) {
						e.preventDefault();
						$(this).data('report').print(false);
					});
					$ul.append($li);
				}
			}
			else {
				item.view_form.find("#report-btn").hide();
			}
		}
		else {
			item.view_form.find("#report-btn").hide();
		}
	}
	this.on_page_loaded = on_page_loaded;
	this.on_view_form_created = on_view_form_created;
	this.on_view_form_shown = on_view_form_shown;
	this.on_view_form_closed = on_view_form_closed;
	this.on_edit_form_created = on_edit_form_created;
	this.on_edit_form_close_query = on_edit_form_close_query;
	this.on_filter_form_created = on_filter_form_created;
	this.on_param_form_created = on_param_form_created;
	this.on_before_print_report = on_before_print_report;
	this.on_view_form_keyup = on_view_form_keyup;
	this.on_edit_form_keyup = on_edit_form_keyup;
	this.create_print_btns = create_print_btns;
}

task.events.events1 = new Events1();

function Events6() { // ps.journals.products 

	function on_edit_form_keyup(item, event) {
		if (event.keyCode === 13){
			item.edit_form.find("#ok-btn").focus();
			item.apply_record();
		}
	}
	this.on_edit_form_keyup = on_edit_form_keyup;
}

task.events.events6 = new Events6();

function Events9() { // ps.details.search_texts 

	function on_view_form_created(item) {
		//item.view_form.find("#new-btn").hide();
		item.view_form.find("#edit-btn").hide();
		//item.view_form.find("#delete-btn").hide();
		//item.table_options.multiselect = false;
	
		//if (!item.lookup_field) {
		var search_add_btn = item.add_view_button('További keresés', {image: 'icon-pencil'});
		search_add_btn.click(function() {search_add(item)});
		var new_search_btn = item.add_view_button('Új keresés', {image: 'icon-pencil'});
		new_search_btn.click(function() {new_search(item) });
		//item.table_options.multiselect = true;
	//}
	}  
	  
	function wait(milliseconds) {
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}
	
	function new_search(item) {
		//console.log('on_view_form_created!');
		//var selections = item.selections;
		//onsole.log(item.search_text.value)//****---------------------
		//if (selections.length==0) console.log(item.search_text.value) 
		// else console.log(selections[0]);	
		 
		yes_no(item,"Az összes eddigi megtalált termék törlődni fog a Találat táblából. Biztosan folytatja?", 
			function(){
				task.search_texts.server('main', [item.search_text.value, true],function(){task.products.refresh_page()});
				
				//open progressbar modal
				let progressBarMessage = task.message(
				'<h3>Új keresés</h3>' +
				'<h5>A korábbi találatok törlődtek.</h5>' +
					'<div class="progress">'+
					'<div id="myBar" class="progress bar" role="progressbar" style="width:0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>'+
					'</div>',
					{title: 'Keresés folyamatban', margin: 0, text_center: true, close_on_escape: false}
					);
			
				//set progress to 0
				const cl = task.progress.clone();
				cl.open();
				cl.edit();
				cl.progress_.value = 0;
				cl.apply();
				cl.close();
				
				//start progressbar
				setTimeout(() => {progress_bar(progressBarMessage)}, 1000);
				
				//refresh products
				task.products.view($('#content'));
				task.products.refresh_page();  
		});			   
	}		
		
	
	function progress_bar(progressBarMessage){
		const elem = document.getElementById("myBar");
		const cl = task.progress.clone();
		cl.open();
		let progress=cl.progress_.value;
		elem.style.width = `${progress}%`;
		if (progress > 99) {
			setTimeout(() => {hide_progress_bar(progressBarMessage)}, 1000);
		} else {
			setTimeout(() => {progress_bar(progressBarMessage)}, 1000);
		}
	}
	
	function hide_progress_bar(progressBarMessage){
		task.hide_message (progressBarMessage);
	}
	
	function search_add(item) {
		task.search_texts.server('main', [item.search_text.value, false],function(err){
		if (err) {
			console.log ("hiba");
			throw err;
		}
		else {
			task.products.refresh_page();
		}	
	});
	   
		
		
		//open progressbar modal
		let progressBarMessage = task.message(
			'<h3>További keresés</h3>' +
			'<h5>A korábbi találatokhoz új termékeket ad hozzá.</h5>' +
			'<div class="progress">'+
			'<div id="myBar" class="progress bar" role="progressbar" style="width:0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>'+
			'</div>',
			{title: 'Keresés folyamatban', margin: 0, text_center: true, close_on_escape: false}
			);  
	 
		//set progress to 0
		const cl = task.progress.clone();
		cl.open();
		cl.edit();
		cl.progress_.value = 0;
		cl.apply();
		cl.close();
		
		//start progressbar
		setTimeout(() => {progress_bar(progressBarMessage)}, 1000);
		
		//refresh products
		task.products.view($('#content'));
		task.products.refresh_page();  
				   
	}		
		
	
	function yes_no(item, mess, yesCallback, noCallback) {
		var buttons = {
			Igen: yesCallback,
			Nem: noCallback,
			//Cancel: cancelCallback
		};
		item.message(mess, {buttons: buttons, margin: "20px",
			text_center: true, width: 500, center_buttons: true});
	}
	this.on_view_form_created = on_view_form_created;
	this.wait = wait;
	this.new_search = new_search;
	this.progress_bar = progress_bar;
	this.hide_progress_bar = hide_progress_bar;
	this.search_add = search_add;
	this.yes_no = yes_no;
}

task.events.events9 = new Events9();

})(jQuery, task)