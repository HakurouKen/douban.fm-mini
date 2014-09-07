module.exports = function(grunt){
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		uglify:{
			dist:{
				files:[
					{
						expand: true,
						cwd: 'src/script',
						src: ['*.js','!*.min.js'],
						dest: 'dist/script',
						ext: '.min.js'
					}
				]
			}
		},
		copy:{
			dist:{
				files:[
					{
						expand: true,
						cwd: 'src/script',
						src: '*.js',
						dest: 'dist/script',
						ext: '.js'
					},{
						expand: true,
						cwd: 'src/image',
						src: '*',
						dest: 'dist/image'
					}
				]
			}
		},
		sass:{
			dist:{
				files:[
					{
						expand: true,
						cwd: 'src/style',
						src: '*.scss',
						dest: 'dist/style',
						ext: '.css'
					}
				]
			}
		},
		cssmin: {
			minify: {
				expand: true,
				cwd: 'dist/style/',
				src: ['*.css','!*.min.css'],
				dest: 'dist/style/',
				ext: '.min.css'
			}
		},
		watch:{
			style: {
				files: ['src/style/*.scss'],
				tasks: ['sass','cssmin']
			},
			script:{
				files: ['src/script/*.js'],
				tasks: ['copy','uglify']
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-sass");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.registerTask('default',['sass','copy','uglify','cssmin','watch']);
}