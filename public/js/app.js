
// var users = [];
var options = {};
var defaultOptions = {
	rpp: 20
}

var $results;
var $options;
var converter = new Showdown.converter();

$(function(){
	$results = $('#results');
	$options = $('#options');


	setOptions();
	writeOptions();
	writeComments();

	$results.on('click', '.toggle', onCommentToggle);
	$options.on('click', '.add-user', onAddUser);
	$options.on('click', '.remove-user', onRemoveUser);
	$options.on('submit', 'form', onSubmit);
});





/*
*	Options / State
*/

function writeOptions(){
	$options.html(getOptionsHtml());
}

function setOptions(){
	options = _.defaults(getQueryParams(), defaultOptions);
	options.users = options.users.split(',');
}

function getQueryParams(){
	var params = {};

	var qs = location.search.split('?');	
	if(qs.length < 2) {
		return params;
	}

	var pairs = qs[1].split('&');
	_.each(pairs, function(pair) {
		var keyVal = pair.split('=');
		var key = decodeURIComponent(keyVal[0]);
		var val = decodeURIComponent(keyVal[1]);
		
		params[key] = val;
	})

	return params;
}

function onSubmit(e) {
	e.preventDefault();

	var $form = $options.find('form');
	var rpp = _.parseInt($form.find('#rpp').val());
	var $users = $form.find('.user');

	var userArr = _.reduce($users, function(arr, el){
		var val = encodeURIComponent($(el).val());
		if(!_.isEmpty(val)) {
			arr.push(val);
		}
		return arr;
	}, []);

	userArr = _.uniq(userArr);
	userArr = userArr.sort(function(a, b){
		var _a = a.toLowerCase();
		var _b = b.toLowerCase();

		if(_a === _b) return 0;
		else if(_a <_b) return -1;
		else return 1;
	});

	var params = [
		'users=' + userArr.join(','),
	];

	if (rpp !== defaultOptions.rpp) {
		params.push('rpp=' + rpp);
	}


	location.search = '?' + params.join('&');
}



/*
*	Comments
*/

function writeComments(){
	async.concat(
		options.users, 
		getUserComments,
		renderComments
	);
}
    

function getUserComments(user, fnCallback){
	$.ajax({
		url: 'http://api.reddit.com/user/' + user + '/comments/new.json', 
		success: onUserComments.bind(null, user, fnCallback),
		error: onUserCommentsError.bind(null, user, fnCallback),
	});
}

function onUserComments(user, fnCallback, results, textStatus, jqXHR) {
	unsetBadUser(user);
	fnCallback(null, results.data.children);
}

function onUserCommentsError(user, fnCallback) {
	setBadUser(user);
	fnCallback(null, []);
}


function renderComments(err, comments){
	var comments = (
		_.chain(comments)
		.sortBy(function(post){return -(_.parseInt(post.data.created_utc))})
		.slice(0, options.rpp)
		.value()
	);


	var toAppend = []; // one dom update
	_.each(comments, function(comment){
		toAppend.push(getRowHtml(comment))
	}); 
	$results.append(toAppend);
}



/*
*	Users
*/

function onAddUser(e) {
	e.preventDefault();
	var $newInput = $(getUserInput());
	$options.find('#users').append($newInput);
}

function onRemoveUser(e) {
	e.preventDefault();
	$(this).closest('.userGroup').hide().remove();
}


function setBadUser(user) {
	$('#user-' + user)
		.addClass('has-error')
		.attr('title', 'Invalid User');
}
function unsetBadUser(user) {
	$('#user' + user)
		.removeClass('has-error')
		.attr('title', '');
}



/*
*	Comment Templating
*/

function getRowHtml(post){
	var momentCreated = moment(post.data.created_utc * 1000);
	var comments = 'http://redd.it/' + post.data.link_id.split('_')[1].toString();
	var sub = 'http://reddit.com/r' + post.data.subreddit;


	return $('<div class="row comment"><div class="col-lg-12">'
		+ '<div class="title">'
			+ '<a href="' + post.data.link_url + '">'
				+ post.data.link_title 
			+ '</a>'
		+ '</div>'
		+ '<div class="meta">'
			+ '<span class="when" title="' + momentCreated.format() + '">' + momentCreated.fromNow() + '</span>'
			+ '<span class="author">'
				+ '<a href="http://reddit.com/u/' + post.data.author + '">'
					+ post.data.author 
				+ '</a>'
			+ '</span>'
			+ '<span class="sub"><a href="' + sub + '">/r/' + post.data.subreddit + '</a></span>'
			+ '<span class="comments"><a href="' + comments + '">comments</a></span>'
		+ '</div>'
		+ '<span class="toggle glyphicon glyphicon-chevron-down"></span>'
		+ '<blockquote>'
			+ '<div class="post snipp">' + post.data.body + '</div>'
			+ '<div class="post full">' + converter.makeHtml(post.data.body) + '</div>'
		+ '</blockquote>'
	+ '</div></div>');
}




/*
*	Option Templating
*/

function getOptionsHtml(){
	return $('<div class="row comment"><div class="col-lg-12"><form class="form" action="/">'
		+ '<fieldset>'
			// + '<legend>Options</legend>'

			+ '<div class="form-group form-group-sm">'
				+ '<label for="rpp">Max Results</label>'
				+ '<input type="numeric" class="form-control input-sm"" name="rpp" id="rpp" value="' + options.rpp + '">'
			+ '</div>'

			+ '<div class="form-group" id="users">'
				+ '<label for="rpp">Users</label>'
				+ _.reduce(options.users, function(userHtml, user){
						userHtml.push(getUserInput(user));
						return userHtml;
					}, []).join('')
			+ '</div>'

			+ '<div class="row">'
				+ '<div class="col-sm-6">'
					+ '<button class="btn btn-block btn-sm btn-primary submit"><span class="glyphicon glyphicon-refresh"></span> Update</button>'
				+ '</div>'
				+ '<div class="col-sm-6">'
					+ '<button class="btn btn-block btn-sm btn-success add-user"><span class="glyphicon glyphicon-plus"></span> Add User</button>'
				+ '</div>'
			+ '</div>'
		+ '</fieldset>'
	+ '</form></div></div>');
}

function getUserInput(user) {
	var userName = ((user) ? user : '');
	var userId = 'user-' + ((user) ? userName : 'null')

	return (
		'<div class="userGroup input-group input-group-sm" id="' + userId + '">'
			+ '<input type="text" class="form-control user" name="users" value="' + userName + '">'
			+ '<div class="remove-user input-sm input-group-addon"><span class="glyphicon glyphicon-minus"></span></div>'
		+ "</div>"
	);

}


/*
*	Behavior
*/

function onCommentToggle(e) {
	var $toggle = $(this)
	$toggle
		.toggleClass('glyphicon-chevron-down')
		.toggleClass('glyphicon-chevron-up')
		.siblings('blockquote')
			.find('.snipp').toggle().end()
			.find('.full').toggle().end()
}