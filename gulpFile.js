var gulp = require('gulp');
var clean = require('gulp-clean');
var gulpCopy = require('gulp-copy');
var shell = require('gulp-shell');
var stylus = require('gulp-stylus');
var include = require('gulp-include');

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

gulp.task('copy-site-script', function(){
    return gulp.src('./modules/site/src/script/libs/*.js') 
        .pipe(gulpCopy('./modules/site/public/script/libs', { prefix: 5 }))
});

gulp.task('compile-site-stylus', function () {
    return gulp.src('./modules/site/src/style/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('./modules/site/public/style'));
});
gulp.task('compile-site-script', function () {
    return gulp.src('./modules/site/src/script/*.js')
        .pipe(include({
            extensions: 'js',
            hardFail: true,
            separateInputs: true,
            includePaths: './modules/site/src/script'
          }))
        .pipe(gulp.dest('./modules/site/public/script'));
});

gulp.task('compile-site', gulp.series('copy-site-script', 'compile-site-stylus', 'compile-site-script'));


gulp.task('shell', shell.task('cd ../dist/ && git cmp "deploy"'));
gulp.task('watch', 
    gulp.series(
        gulp.series('compile-site'), 
        function() {
            gulp.watch(
                [
                    './modules/site/src/style/*.styl',
                    './modules/site/src/style/common/*.styl'
                ], 
                gulp.series('compile-site-stylus')
            );

            gulp.watch(
                [
                    './modules/site/src/script/*.js',
                    './modules/site/src/script/common/*.js'
                ], 
                gulp.series('compile-site-script')
            );
            
            gulp.watch(
                [
                    './modules/site/src/script/libs/*.js',
                ], 
                gulp.series('copy-site-script')
            );
        })
);

gulp.task('default', gulp.series('clean', 'compile-site', 'copy', 'cleanbak', 'shell'));