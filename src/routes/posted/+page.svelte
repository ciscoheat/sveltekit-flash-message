<script lang="ts">
</script>

<aside class="interactions" />

<article>
	<h1>After POST page</h1>
	<p>This is where a POST should redirect. <a href="/">Back</a></p>
	<p>
		Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Vivamus suscipit tortor
		eget felis porttitor volutpat. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet
		dui.
	</p>
</article>

<style lang="scss">
	@import '../mixins.scss';

	article {
		@include stack-vertical;

		padding: 2rem 4rem;

		background-color: $white;

		border: 1px solid rgb(224, 224, 224);
		border-radius: 8px;
	}
</style>
