<script lang="ts">
  import './root.scss';

  import { page } from '$app/stores';
  import { beforeNavigate } from '$app/navigation';
  import type { LayoutData } from './$types';
  import { initFlash } from '$lib/client';

  let messages = initFlash(page);

  const timeoutMs = 5000;
  let flashTimeout: ReturnType<typeof setTimeout>;

  $: if ($messages) {
    clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => ($messages = undefined), timeoutMs);
  }

  function clear() {
    $messages = [];
  }

  beforeNavigate((nav) => {
    if ($messages && nav.from?.url.toString() != nav.to?.url.toString()) {
      $messages = [];
    }
  });

  export let data: LayoutData;
</script>

<div class="app">
  <header>
    <div class="left">
      <input type="text" placeholder="Search..." />
    </div>
    <div class="right">
      <a href="/">Log in</a>
      <a href="/">Create account</a>
      <button id="clear" on:click={clear}>Clear messages</button>
    </div>
  </header>
  <div id="messages">
    {#if $messages}
      {#each $messages as msg}
        {@const bg = msg.status == 'ok' ? '#3D9970' : '#FF4136'}
        <div data-status={msg.status} style:background-color={bg} class="flash">{msg.text}</div>
      {/each}
    {/if}
  </div>
  <main>
    <slot />
  </main>

  <footer>
    <p>{data.test}</p>
    <p>
      Sed porttitor lectus nibh. Nulla quis lorem ut libero malesuada feugiat. Curabitur non nulla
      sit amet nisl tempus convallis quis ac lectus.
    </p>
    <p>
      Curabitur aliquet quam id dui posuere blandit. Cras ultricies ligula sed magna dictum porta.
      Donec rutrum congue leo eget malesuada.
    </p>
  </footer>
</div>

<style lang="scss">
  @import './mixins.scss';

  /////////////////////////////////////////////////////////

  .app {
    // Obvious
    display: grid;

    // Almost obvious
    min-height: 100vh;

    .flash {
      text-align: center;
      color: $white;
      font-weight: bold;
    }
  }

  ///////////////////////////////////////////////////////////

  header {
    // Horizontal stacking
    @include stack-horizontal;
    @include auto-padding(8px);

    justify-content: space-between;

    background-color: $white;
    border-bottom: 1px solid rgb(224, 224, 224);

    .left {
      @include stack-horizontal;
      grid-row: 1;
    }

    .right {
      @include stack-horizontal;
      grid-row: 1;
    }
  }

  main {
    @include auto-padding;
    @include stack-horizontal;
    grid-template-columns: 1fr 14fr 5fr;

    @media (max-width: $mobile) {
      @include stack-vertical;
    }

    align-items: start;

    background-color: rgb(245, 245, 245);
  }

  footer {
    @include stack-horizontal;
    @include auto-padding;
    grid-template-columns: 2fr 1fr 1fr;

    background-color: rgb(229, 229, 229);
  }
</style>
