
// var users = [];
var options = {};
var defaultOptions = {
	rpp: 20
}
var converter = new Showdown.converter();

var $options, $results;
var optionsTemplate, userInputTemplate;
var listingTemplate, postTemplate

$(function(){
	$options = $('#options');
	optionsTemplate = _.template($('#optionsTemplate').html());
	userInputTemplate = _.template($('#userInputTemplate').html());
	
	$results = $('#results');
	listingTemplate = _.template($('#listingTemplate').html());
	postTemplate = _.template($('#postTemplate').html());


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

function setOptions(){
	options = _.defaults(getQueryParams(), defaultOptions);
	options.users = (options.users || 'alienth,bsimpson,Dacvak,hueypriest,kemitche,rram,spladug').split(',');
}

function writeOptions(){
	$options.html(
		optionsTemplate({options: options})
	);
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
		.map(function(post){
			post.momentCreated = moment(post.data.created_utc * 1000);
			post.commentsLink = 'http://redd.it/' + post.data.link_id.split('_')[1].toString();
			post.subredditLink = 'http://reddit.com/r/' + post.data.subreddit;
			return post;
		})
		.value()
	);

	$results.html(
		listingTemplate({comments: comments})
	);
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
	return $(postTemplate({post: post}));
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