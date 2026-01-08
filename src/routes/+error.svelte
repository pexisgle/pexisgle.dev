<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="bg center">
	<h1>Error {page.status}</h1>
	<p>{page.error?.message ?? 'An unexpected error occurred.'}</p>
	<a href="/">Return to Home</a>
</div>

<style lang="sass">
:global(body)
    margin: 0
    padding: 0

.bg
    height: 100vh
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    background-color: #121212
    color: #f0f0f0
    text-align: center

    h1
        font-size: 4rem
        margin-bottom: 1rem

    p
        font-size: 1.5rem
        margin-bottom: 2rem

    a
        font-size: 1.2rem
        color: #61dafb
        text-decoration: none

        &:hover
            text-decoration: underline
</style>
