

class Assembler {

    /**
     * Very simple parsing of assembly text.
     * Does not check semantics.
     */
    *parseText(text: string) {
        var mo: RegExpMatchArray | RegExpExecArray;
        for (mo of text.matchAll(/[^\n]+/g)) {
            let line = mo[0].trim();
            if (mo = line.match(/(.*):$/)) {
                yield mo[1];
            }
            else if (mo = line.match(/(\S+)(?:\s+(.*))?/)) {
                let [, opcode, arg] = mo, num = parseInt(arg),
                    nums = opcode === 'YANK' ? arg.split(/,/).map(x => parseInt(x)) : null;
                yield [opcode, nums ?? (isNaN(num) ? arg : num)];
            }
            else {
                console.error('(in asm) ', line);
            }
        }
    }

    unparseJson(json: (string | any[])[]) {
        return json.map(ln => typeof ln === 'string' ? `${ln}:`
                                                     : `  ${ln.join(' ')}`)
            .join('\n');
    }
}


export { Assembler }