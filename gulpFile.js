var gulp = require('gulp');
var clean = require('gulp-clean');
var gulpCopy = require('gulp-copy');
var shell = require('gulp-shell');

/*
    git config --global alias.cmp '!f() { git add -A && git commit -m "$@" && git push; }; f'
    Usage: git cmp "Long commit message goes here"
*/

gulp.task('clean', function () {
    return gulp.src('../dist/*')
    .pipe(clean({ force: true }));
});

gulp.task('copy', function(){
    return gulp.src([
        './**', 
        '!./.git', 
        '!./node_modules/**'
    ]) 
    .pipe(gulpCopy('../dist/'))
});

gulp.task('shell', shell.task('cd ../dist/ && git cmp "deploy"'));

gulp.task('default', gulp.series('clean', 'copy', 'shell'));