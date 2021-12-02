var gulp = require('gulp');
var clean = require('gulp-clean');
var gulpCopy = require('gulp-copy');
var shell = require('gulp-shell');
var stylus = require('gulp-stylus');

/*
Git alias:
    git config --global alias.cmp '!f() { git add -A && git commit -m "$@" && git push; }; f'
    Usage: git cmp "Long commit message goes here"

Multi repo:
    git clone <repo_1>
    git remote add all <repo_1>
    git remote set-url --add --push all <repo_2>
    git remote set-url --add --push all <repo_1>
    (change --> [branch "master"] remote = all <-- in .git/config)

*/

gulp.task('clean', function () {
    return gulp.src('../dist/*')
    .pipe(clean({ force: true }));
});

gulp.task('cleanbak', function () {
    return gulp.src('../dist/modules/storage/backup/dump/*')
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

gulp.task('compile-stylus', function () {
    return gulp.src('./modules/site/stylus/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('./modules/site/public/style'));
});

gulp.task('shell', shell.task('cd ../dist/ && git cmp "deploy"'));
gulp.task('watch', gulp.series('compile-stylus', function() {
    gulp.watch([
        './modules/site/stylus/*.styl',
        './modules/site/stylus/blocks/*.styl'
    ], gulp.series('compile-stylus'))
}));

//gulp.task('default', gulp.series('clean', 'compile-stylus', 'copy', 'cleanbak', 'shell'));