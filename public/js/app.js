var defaultOptions = {
	rpp: 20
}

var $options, $results

$(function(){
	$options = $('#options');
	$results = $('#results');



	async.auto({
		'options': setOptions,
		'templates': compileTemplates,
		'writeOptions': ['templates', 'options', writeOptions],
		'writeComments': ['templates', 'options', writeComments],
	}, function(err, results){
		$results.on('click', '.toggle', onCommentToggle);

		$options.on('click', '.add-user', onAddUser.bind(null, results.templates))
			.on('click', '.remove-user', onRemoveUser)
			.on('submit', 'form', onSubmit);
	});


});





/*
*	Templates
*/

function compileTemplates(fnCallback) {
	var $templates = $('script[type="text/template"]');

	var templates = {};

	async.each(
		$templates,
		function(template, next) {
			var $template = $(template);
			templates[$template.data('key')] = _.template($template.html());
			next();
		},
		function(err) {
			fnCallback(null, templates);
		}
	)
}



/*
*	Options / State
*/

function setOptions(fnCallback){
	options = _.defaults(getQueryParams(), defaultOptions);
	options.users = (options.users || 'alienth,bsimpson,Dacvak,hueypriest,kemitche,rram,spladug').split(',');
	fnCallback(null, options);
}

function writeOptions(fnCallback, results){
	$options.html(
		results.templates['/options']({options: results.options, templates: results.templates})
	);

	fnCallback();
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

function writeComments(fnCallback, results){
	async.concat(
		results.options.users, 
		getUserComments,
		renderComments.bind(null, results.templates, fnCallback)
	);
}
    

function getUserComments(user, fnCallback){
	$.ajax({
		url: 'https://api.reddit.com/user/' + user + '/comments/new.json', 
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


function renderComments(templates, fnCallback, err, comments){
	var converter = SnuOwnd.getParser();

	var $comments = $(
			_.chain(comments)
			.sortBy(function(post){return -(_.parseInt(post.data.created_utc))})
			.slice(0, options.rpp)
			.map(function(post){
				post.momentCreated = moment(post.data.created_utc * 1000);
				post.subredditLink = 'http://www.reddit.com/r/' + post.data.subreddit;
				post.commentsLink = post.subredditLink + '/comments/' + post.data.link_id.split('_')[1].toString();
				post.permalink = post.commentsLink + '//' + post.data.id;
				post.parentlink = post.commentsLink + '//' + post.data.parent_id.split('_')[1];
				post.markdownHtml = converter.render(post.data.body);

				return templates['/listing/post']({post: post});
			})
			.value()
			.join('')
		)
		.hide()
		.appendTo($results.empty())
		.velocity("transition.slideUpIn", {stagger: 150, duration: 300})

	fnCallback();
}



/*
*	Users
*/

function onAddUser(templates, e) {
	e.preventDefault();
	var $newInput = $(templates['/options/userInput']({user: null}))
		.hide()
		.appendTo('#users')
		.velocity("transition.expandIn", 300);
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
*	Behavior
*/

function onCommentToggle(e) {
	var $toggle = $(this)
	$toggle
		.toggleClass('glyphicon-chevron-down')
		.toggleClass('glyphicon-chevron-up')
		.siblings('blockquote').toggleClass('snipp')
}