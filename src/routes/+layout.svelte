<script lang=ts>
  import './root.scss'
  import { Flash } from "$lib/client.js"
  import { page } from '$app/stores'

  const message = new Flash(page, v => {
    if(!v || typeof v !== 'object') return undefined
    return v as App.PageData['flash']
  }).message

  function clear() {
    $message = undefined
  }
</script>

<div class="app">
  <header>
    <div class="left">
      <input type="text" placeholder="Search...">
    </div>
    <div class="right">
      <a href="/">Log in</a>
      <a href="/">Create account</a>
      <button id="clear" on:click={clear}>Clear messages</button>
    </div>
  </header>
  <div id="messages">
    {#if $message}
      {#each $message as msg}
        {@const bg = msg.status == 'ok' ? '#3D9970' : '#FF4136'}
        <div data-status={msg.status} style:background-color={bg} class="flash">{msg.text}</div>
      {/each}
    {/if}
  </div>
  <main>
    <slot></slot>
  </main>

  <footer>
      <p>Donec sollicitudin molestie malesuada. Donec sollicitudin molestie malesuada. Cras ultricies ligula sed magna dictum porta.</p>
      <p>Sed porttitor lectus nibh. Nulla quis lorem ut libero malesuada feugiat. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.</p>
      <p>Curabitur aliquet quam id dui posuere blandit. Cras ultricies ligula sed magna dictum porta. Donec rutrum congue leo eget malesuada.</p>
  </footer>
</div>

<style lang="scss">
  @import "./mixins.scss";

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
    border-bottom: 1px solid rgb(224,224,224);
    
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
    
    background-color: rgb(245,245,245);
  }

  footer {
    @include stack-horizontal;
    @include auto-padding;
    grid-template-columns: 2fr 1fr 1fr;

    background-color: rgb(229,229,229);
  }
</style>