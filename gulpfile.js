var gulp        = require('gulp');
var sass        = require('gulp-sass');
var watch       = require('gulp-watch');
var plumber     = require('gulp-plumber');
var browserSync = require('browser-sync');
var prefix      = require('gulp-autoprefixer');
var uglify      = require('gulp-uglify');
var notify      = require("gulp-notify");
var filter      = require("gulp-filter");
var imagemin    = require('gulp-imagemin');
var svgSprite   = require("gulp-svg-sprites");
var svg2png     = require('gulp-svg2png');
var gutil       = require('gulp-util');
var source      = require('vinyl-source-stream');
var react       = require('gulp-react');
var browserify  = require('browserify');
var reactify    = require('reactify');
var watchify    = require('watchify');

/**
 * Config
 */
var scriptsDir      = './scripts/src';
var scriptsBuildDir = './scripts/dist';

gulp.task('sass', function(){
    gulp.src(['styles/scss/styles.scss'])
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sass())
        .pipe(prefix('last 2 versions'))
        .pipe(gulp.dest('styles/css'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('react', function () {
        gulp.src(scriptsDir + '/**/*.js')
                .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
                .pipe(react({harmony: true}))
                .pipe(gulp.dest('scripts/dist'))
                .pipe(browserSync.reload({stream:true, once: true}));
});

gulp.task('browser-sync', function() {
    browserSync.init([
        'styles/css/*.css',
        'images/**/*.jpg',
        'images/**/*.png',
        'images/**/*.svg',
        'scripts/dist/**/*.js',
        '**/.*.html'
    ], {
        proxy: 'prototype.dev',
        tunnel: false,
        ghostMode: false,
        notify: false,
        open: false
    });
});

gulp.task('imagemin', function () {
    return gulp.src('images/**/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
        }))
        .pipe(gulp.dest('images'));
});

gulp.task('sprite', function () {
    return gulp.src('images/icons/**/*.svg')
        .pipe(svgSprite({
            baseSize: 16,
            cssFile: "scss/_sprite.scss",
            svgPath: "/images/sprites/%f",
            pngPath: "/images/sprites/%f"
        }))
        .pipe(gulp.dest("images/sprites"))
        .pipe(filter("**/*.svg"))
        .pipe(svg2png([2]))
        .pipe(gulp.dest("images/sprites"));
});

gulp.task('svg2png', function () {
    return gulp.src(['images/**/*.svg', '!images/icons{,/**}', '!images/sprites{,/**}'])
        .pipe(svg2png([2]))
        .pipe(gulp.dest("images/"));
});

gulp.task('build', function(){
    gulp.src(['styles/scss/styles.scss'])
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(prefix('last 2 versions'))
        .pipe(gulp.dest('styles/css'));

    return buildReactScripts('main.js', false);
});

gulp.task('default', ['sass', 'browser-sync'], function () {
    gulp.watch("styles/scss/**/*.scss", ['sass']);
    return buildReactScripts('main.js', true);
});

// Based on: http://blog.avisi.nl/2014/04/25/how-to-keep-a-fast-build-with-browserify-and-reactjs/
function buildReactScripts(file, watch) {
    var props = watchify.args;
    props.entries = [scriptsDir + '/' + file];
    props.debug = true;

    var bundler = watch ? watchify(browserify(props)) : browserify(props);

    bundler.transform(reactify);
    function rebundle() {
        var stream = bundler.bundle();
        return stream.on('error', notify.onError({
                title: "Compile Error",
                message: "<%= error.message %>"
            }))
            .pipe(source(file))
            .pipe(gulp.dest(scriptsBuildDir + '/'))
            .pipe(browserSync.reload({stream:true}));
    }
    bundler.on('update', function() {
        rebundle();
        gutil.log('Rebundle...');
    });
    return rebundle();
}
