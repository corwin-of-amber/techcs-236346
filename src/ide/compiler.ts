import child_process from 'child_process';
import concat from 'concat-stream'; /** @kremlin.native */

/**
 * Runs the external (Python-based) compiler.
 */
class CompilerBackend {
    compile(irText: string): Promise<string> {
        return new Promise((resolve, reject) => {

            var sp = child_process.spawn('python3', ['ref/sw/compiler/backend.py']);
            sp.stdout.pipe(concat({encoding: 'string'}, s => resolve(s)));
            sp.stderr.pipe(concat({encoding: 'string'}, s => {
                if (s) { console.error('(compiler backend)', s); reject(s); }
            }));
            sp.stdin.write(irText);
            sp.stdin.end();
        
        });
    }
}


export { CompilerBackend }