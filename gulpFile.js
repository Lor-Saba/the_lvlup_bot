var gulp = require('gulp');
var clean = require('gulp-clean');
var gulpCopy = require('gulp-copy');
var shell = require('gulp-shell');

var deployRepo = '../8082-374d46bc7cda874ee116bf957f446153';

/*
    git config --global alias.cmp '!f() { git add -A && git commit -m "$@" && git push; }; f'

    Usage: git cmp "Long commit message goes here"
*/

gulp.task('clean', function () {
    return gulp.src(deployRepo + '/*')
    .pipe(clean({ force: true }));
});

gulp.task('copy', function(){
    return gulp.src([
        './**', 
        '!./.*', 
        '!./*.bat', 
        '!./gulpFile.js', 
        '!./node_modules/**',
        './.gitignore'
    ]) 
    .pipe(gulpCopy(deployRepo + '/'))
});

gulp.task('shell', shell.task('cd ' + deployRepo + '/ && git cmp "deploy"'));

gulp.task('default', gulp.series('clean', 'copy', 'shell'));