const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');
const { minify: terserMinify } = require('terser');

async function buildProject() {
    console.log('🔧 Starting obfuscation build...');
    
    // Create dist directory
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }
    
    // Read source HTML
    const htmlContent = fs.readFileSync('src/index.html', 'utf8');
    
    // Extract JavaScript from HTML
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
        throw new Error('No JavaScript found in HTML file');
    }
    
    const originalJS = scriptMatch[1];
    
    // Obfuscate JavaScript with Terser
    console.log('🔒 Obfuscating JavaScript...');
    const obfuscatedResult = await terserMinify(originalJS, {
        mangle: {
            toplevel: true,
            properties: {
                regex: /^_/  // Mangle properties starting with _
            }
        },
        compress: {
            dead_code: true,
            drop_console: false,  // Keep console.log for debugging
            drop_debugger: true,
            pure_funcs: ['console.debug'],
            passes: 3
        },
        format: {
            comments: false,
            beautify: false
        }
    });
    
    if (obfuscatedResult.error) {
        throw obfuscatedResult.error;
    }
    
    // Replace JavaScript in HTML
    const obfuscatedHTML = htmlContent.replace(
        /<script>[\s\S]*?<\/script>/,
        `<script>${obfuscatedResult.code}</script>`
    );
    
    // Minify HTML
    console.log('📦 Minifying HTML...');
    const minifiedHTML = await minify(obfuscatedHTML, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: false  // Already minified JS separately
    });
    
    // Write obfuscated file
    fs.writeFileSync('dist/index.html', minifiedHTML);
    
    console.log('✅ Build complete!');
    console.log('📁 Obfuscated files created in dist/ folder');
    console.log('🚀 Ready for Netlify deployment');
}

buildProject().catch(console.error);