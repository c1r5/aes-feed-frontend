import type { Post } from '$lib/types'

// Premium posts encrypted with test MasterKey:
// hex: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
// HKDF(masterKey, postId, postSalt) → PostKey → AES-GCM

// Post 4 plaintext:
// # Exploit Database Dump
// This is a **premium** encrypted post containing sensitive exploit data.
// ## Details
// - Target: CVE-2024-XXXX
// - Vector: Remote code execution
// - Severity: Critical
// ```
// proof-of-concept code here
// ```

// Post 5 plaintext:
// # Private Intelligence Report
// Classified analysis of recent **network intrusions** across financial sector.
// ## Key Findings
// 1. New lateral movement technique identified
// 2. C2 infrastructure mapped
// 3. Attribution analysis complete
// > Access granted via payment verification.

const seed: Post[] = [
	{
		id: '550e8400-e29b-41d4-a716-446655440010',
		slug: 'linux-kernel-hardening-guide',
		title: 'Linux Kernel Hardening Guide 2024',
		author: 'a3f7c1',
		is_premium: false,
		created_at: '2026-03-27T14:30:00Z',
		body: '# Linux Kernel Hardening Guide 2024\n\nEssential steps for securing your kernel.\n\n## sysctl Tweaks\n```\nkernel.randomize_va_space = 2\nkernel.kptr_restrict = 2\nnet.ipv4.conf.all.rp_filter = 1\n```\n\n## Compile-time Options\n- Enable `CONFIG_STACKPROTECTOR_STRONG`\n- Enable `CONFIG_FORTIFY_SOURCE`\n- Disable `CONFIG_DEVMEM`\n\n> Always audit your configuration against your threat model.'
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440020',
		slug: 'tor-opsec-mistakes',
		title: 'Common Tor OPSEC Mistakes',
		author: 'b9e2d4',
		is_premium: false,
		created_at: '2026-03-26T09:15:00Z',
		body: '# Common Tor OPSEC Mistakes\n\nMost deanonymization happens due to **user error**, not protocol flaws.\n\n## Top Mistakes\n1. Using Tor Browser with JavaScript enabled on sensitive sites\n2. Logging into personal accounts over Tor\n3. Mixing Tor and non-Tor traffic on the same machine\n4. Ignoring DNS leaks\n\n## Mitigation\n- Use Whonix or Tails for isolation\n- Never reuse identities across contexts\n- Assume your threat model includes timing analysis'
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440030',
		slug: 'cryptographic-hash-comparison',
		title: 'SHA-3 vs BLAKE3: Practical Comparison',
		author: 'c4d8f0',
		is_premium: false,
		created_at: '2026-03-25T18:00:00Z',
		body: '# SHA-3 vs BLAKE3: Practical Comparison\n\nBoth are solid choices, but they optimize for different things.\n\n| Feature | SHA-3 | BLAKE3 |\n|---------|-------|--------|\n| Speed | Moderate | Very fast |\n| Parallelism | No | Yes (tree hashing) |\n| NIST Standard | Yes | No |\n| Output size | Fixed | Extendable |\n\n## Recommendation\nUse **BLAKE3** for performance-critical applications.\nUse **SHA-3** when compliance requires NIST standards.'
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440001',
		slug: 'exploit-db-dump-q1',
		title: 'Exploit Database Dump — Q1 2024',
		author: 'e7a1b3',
		is_premium: true,
		created_at: '2026-03-28T02:00:00Z',
		encrypted_blob:
			'ZOrFlWl6XWdvBqJiP9m/fUjyqqj1pPcREdnU/YauAHdK6JJCijSZWt3vtd0hC1ae26bduEW/KGJT+lu/OA3kVsNHa7kS0/T8aAy3HbwS87hJTfc4p6J0ob+K66OIXV0VLW5F9HmZq9jTtFCis9nMCAgfRPrzLgH1GOeUq7QCqDaqRuKkJ86o7SBDOCdxKOmIISZHrKRynNybug0yW9bkP9cwnjyOm9gXcQ2Ijfhs8Pi+1dgw3bUfEuNxl2KhnrydH+Nt5NZrS485yNJ22tktteZp0rcsKBqCg0mNhrpSJT+NdDQhZQGxxF07SfgA4ogFP4egWZucxB9k',
		post_salt: 'obLD1OX2p7jJ0OHyo7TF1g=='
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440002',
		slug: 'private-intel-report-march',
		title: 'Private Intelligence Report — March',
		author: 'f2c9a6',
		is_premium: true,
		created_at: '2026-03-28T06:00:00Z',
		encrypted_blob:
			'YHCqfHb/Vch0DMILkXHT/rnD8BTxfPHLvfkPk+dJ4PmY55A+7qQrRM9wE6dIiQVKjv97atQ/GEasHG6lH+8Q9XjsGUeTYG7YYDAUpgoHAnDQxRfo53DxrondPqTF9vo4BTTYXaCFuXM3AgAN2jb0cceGfo+AIIgd30OMLMphpOdyK9F2AYhLkdpPUiVIl7G/SQqctJBZ9x/KT71YAjOgTCCwqku5n4JGYO6IZL9618UPfuPB6uFzdBR7YSMBh59Dolbk0kd+fNPjW9kYJhrj40Sb6KS78P+InJn0HoX2XcNe+KMzc2Jkz5bkfDqOzo5edrkykly+SsweGrwQ1h0+X1ZzGqX9jhgE9ftJQTh1D6AusgCO/sQplnmURVOBI1isF4REgzZ4Xbi+peA2o9Cl',
		post_salt: '3q2+78r+ur4SNFZ4kKvN7w=='
	}
]

export let posts = $state<Post[]>([...seed])

export function addPost(post: Post) {
	posts.unshift(post)
}
