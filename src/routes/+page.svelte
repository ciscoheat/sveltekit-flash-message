<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import { getFlash, updateFlash } from '$lib/client';
  import { page } from '$app/stores';

  let count = 0;
  const store = getFlash(page);

  function change() {
    const msg = { status: 'ok' as const, text: 'Updated on client ' + ++count };
    $store = [...($store ?? []), msg];
  }

  async function submitForm(e: Event) {
    const form = e.target as HTMLFormElement;
    const body = new FormData(e.target as HTMLFormElement);

    const response = await fetch(form.action, {
      method: 'POST',
      body
    });

    updateFlash(page, (newValue) => {
      if (Array.isArray(newValue)) {
        return [{ status: newValue[0].status, text: '###' + newValue[0].text }];
      } else {
        return newValue as App.PageData['flash'];
      }
    });
  }

  export let data: PageData;
</script>

<aside class="interactions">
  <i class="fa-regular fa-heart fa-2x" />
  <i class="fa-regular fa-lightbulb fa-2x" />
  <i class="fa-regular fa-thumbs-up fa-2x" />
</aside>

<article>
  <h1>sveltekit-flash-message testing ground</h1>
  <h2>{data.test}</h2>
  <p>
    <a href="/">Link to here</a> <a href="/posted">Link to posted</a>
    <a href="/?reset">Reset counter</a>
    egestas non nisi. Vivamus suscipit tortor eget felis porttitor volutpat. Vestibulum ac diam sit amet
    quam vehicula elementum sed sit amet dui.
  </p>

  <form method="POST" action="?/normal">
    <button id="action-post">Submit to action normally</button>
  </form>

  <form method="POST" action="?/normal" use:enhance>
    <button id="action-post-normal-enhanced">Submit to action with enhanced form</button>
  </form>

  <p>
    Sed porttitor lectus nibh. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.
    Quisque velit nisi, pretium ut lacinia in, elementum id enim.
  </p>
  <p>
    Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Proin eget tortor risus.
    Curabitur aliquet quam id dui posuere blandit.
  </p>
  <button id="update-client" on:click={change}>Change on client</button>
  <h3>Nulla portitur accusam tincidunt.</h3>
  <form method="POST" action="/test" on:submit|preventDefault={submitForm}>
    <input type="text" name="test" value="TEST" />
    <button id="endpoint-client">Submit to endpoint client-side</button>
  </form>

  <form method="POST" action="/test">
    <button id="endpoint-server">Submit to endpoint server-side</button>
  </form>

  <form method="POST" use:enhance>
    <button formaction="?/enhanced" id="action-post-enhanced"
      >Submit to different page with enhanced form</button
    >
  </form>
</article>

<aside class="info">
  <section>
    <h3>Lorem Ipsum</h3>
    <p>
      Curabitur aliquet quam id dui posuere blandit. Cras ultricies ligula sed magna dictum porta.
    </p>
  </section>
  <section>
    <h3>More from Lorem Ipsum</h3>
    <p>
      Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Praesent sapien massa,
      convallis a pellentesque nec, egestas non nisi.
    </p>
  </section>
</aside>

<style lang="scss">
  @import './mixins.scss';

  aside {
    @include stack-vertical;
    justify-content: center;

    &.interactions {
      gap: 2rem;
      margin-top: 2rem;
      color: #575757;
      text-align: center;
    }

    &.info > section {
      @include stack-vertical;

      padding: 1rem;

      color: #575757;
      background-color: rgb(250, 250, 250);

      border: 1px solid rgb(234, 234, 234);
      border-radius: 8px;
    }
  }

  article {
    @include stack-vertical;

    padding: 2rem 4rem;

    background-color: $white;

    border: 1px solid rgb(224, 224, 224);
    border-radius: 8px;
  }
</style>
