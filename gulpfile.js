const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require("gulp-uglify");

gulp.task('js:minify', function() {
  return gulp.src([
	'./src/js/lib/*.js',
	'./src/js/plugins/*.js',
	'./src/js/*.js',
	])
    .pipe(concat('all.min.js'))
    .pipe(uglify({preserveComments: 'some'}))
	.pipe(gulp.dest('./dist/js'))
});

gulp.task('build', ['js:minify'], ()=>{
	return  console.log('building...');
});

gulp.task('default', ['build'], ()=>{
	return gulp.src('./src/*.html')
    .pipe(gulp.dest('./build/'))
});
