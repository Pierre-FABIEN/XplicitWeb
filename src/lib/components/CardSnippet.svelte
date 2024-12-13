<script lang="ts">
	let { testSnippet, testNestedSnippet } = $props();

	console.log(testSnippet, 'testSnippet');
</script>

NAME: {@render testSnippet()}
testNestedSnippet: {@render testNestedSnippet()}
