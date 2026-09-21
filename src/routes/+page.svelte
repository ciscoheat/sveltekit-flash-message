<script lang="ts">
  import { enhance } from "$app/forms";
  import { getFlash, goto } from "#lib";
  import {
    remoteFlashCommand,
    remoteForm,
    remoteRedirect,
  } from "./remotes.remote.js";

  const { data } = $props();
  const flash = getFlash();

  const test = $derived(data.test * 2);

  // JS only
  $effect(() => {
    document
      .getElementById("action-form")
      ?.insertAdjacentHTML(
        "beforeend",
        '<input type="hidden" name="js" value="1"/>',
      );
  });
</script>

<section class="bg-muted" id="overview">
  <div class="eyebrow">A complete rewrite of</div>
  <h1>sveltekit-flash-message</h1>
</section>

<span class="hidden data-test-page">{test}</span>

<section id="server-side">
  <h3>Server-side actions</h3>
  <div class="grid md:grid-cols-2 gap-4 items-start">
    <div class="card">
      <p>
        Send a <a
          href="https://next.svelte.dev/docs/kit/remote-functions#command"
          target="_blank">remote command</a
        > that sets a flash message.
      </p>
      <button
        class="btn"
        onclick={async () => {
          await remoteFlashCommand("Remote flash command");
        }}>Set flash message</button
      >
    </div>

    <form
      class="card"
      {...remoteForm.enhance(async (form) => {
        await form.submit();
      })}
    >
      <p>Set a flash message through a remote form.</p>
      <dl class="grid grid-cols-[max-content_1fr] gap-4">
        <dt class="mt-1"><label for="set-flash-name">Name</label></dt>
        <dd>
          <input
            id="set-flash-name"
            class="w-full bg-muted-foreground/60 rounded-full px-3 py-1"
            {...remoteForm.fields.name.as("text")}
          />
          {#each remoteForm.fields.name.issues() as issue (issue.message)}
            <p class="text-red-500">{issue.message}</p>
          {/each}
        </dd>
        <dt></dt>
        <dd>
          <input {...remoteForm.fields.shouldRedirect.as("checkbox")} /> Redirect
          instead of setFlash
        </dd>
        <dt></dt>
        <dd><button class="btn">Submit</button></dd>
      </dl>
    </form>
    <form
      class="card"
      id="redirect-form"
      {...remoteRedirect.enhance(async (form) => {
        const nameInput =
          form.element.querySelector<HTMLInputElement>("#redirect-name");
        const useGotoInput = form.element.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        const name =
          nameInput instanceof HTMLInputElement ? nameInput.value : "";
        const useGoto =
          useGotoInput instanceof HTMLInputElement && useGotoInput.checked;
        console.log("enhance: Submit form");
        await form.submit();
        console.log("enhance: Remote form submitted");

        if (useGoto) {
          console.log("enhance: Redirecting with goto");
          await goto("/posted", {
            flash: { message: name + ": Redirect with goto" },
          });
        }
      })}
    >
      <p>Post and redirect to another route with a flash message</p>
      <dl class="grid grid-cols-[max-content_1fr] gap-4">
        <dt class="mt-1"><label for="redirect-name">Name</label></dt>
        <dd>
          <input
            id="redirect-name"
            class="w-full bg-muted-foreground/60 rounded-full px-3 py-1"
            {...remoteRedirect.fields.name.as("text")}
          />
          {#each remoteRedirect.fields.name.issues() as issue (issue.message)}
            <p class="text-red-500">{issue.message}</p>
          {/each}
        </dd>
        <dt></dt>
        <dd>
          <input {...remoteRedirect.fields.useGoto.as("checkbox")} /> Redirect
          with
          <code>goto</code> on the client
        </dd>

        <dt></dt>
        <dd><button class="btn">Submit</button></dd>
      </dl>
    </form>
    <form id="action-form" class="card" method="POST" use:enhance>
      <p>
        Use a normal SvelteKit form action that calls <code>setFlash</code>.
      </p>
      <dl class="grid grid-cols-[max-content_1fr] gap-4">
        <dt class="mt-1"><label for="action-name">Name</label></dt>
        <dd>
          <input
            id="action-name"
            name="name"
            class="w-full bg-muted-foreground/60 rounded-full px-3 py-1"
          />
        </dd>
        <dt></dt>
        <dd><button class="btn">Submit</button></dd>
      </dl>
    </form>
  </div>
</section>

<section id="client-side">
  <h3>Client-side actions</h3>
  <div class="grid md:grid-cols-2 gap-4 items-start">
    <div class="card">
      <p>Set a flash message on the client with <code>getFlash</code>.</p>
      <button
        class="btn"
        onclick={() =>
          (flash.value = {
            message:
              "Client-side flash set at " +
              new Date().toLocaleTimeString().substring(0, 8),
          })}>Set flash message</button
      >
    </div>
    <div class="card">
      <p>
        Clear the flash message by setting its value to <code>undefined</code>.
      </p>
      <button class="btn" onclick={() => (flash.value = undefined)}
        >Clear flash message</button
      >
    </div>
  </div>
</section>

<section id="other">
  <h3>Other</h3>
  <div class="grid md:grid-cols-2 gap-4 items-start">
    <div class="card">
      <p>Navigating to a page will clear the flash message.</p>
      <a href="/">Reload this page with navigation</a>
    </div>
  </div>
</section>
