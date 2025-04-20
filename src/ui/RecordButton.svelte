<script>
  let open = false;

  function toggle() {
    open = !open;
  }
</script>

<div style="display: inline-block; position: relative; margin: 10px;">
  <button
    on:click={toggle}
    style="padding: 8px 14px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
    {open ? '✖ Закрыть' : '📋 Открыть схемочку тест 1'}
  </button>

  {#if open}
    <div
      style="position: absolute; top: 45px; left: 0; background: white; border: 1px solid #ccc; padding: 10px; width: 250px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border-radius: 6px;">
      <strong>Этап 1:</strong> Осмотр<br>
      <strong>Этап 2:</strong> Назначения<br>
      <strong>Этап 3:</strong> Контроль<br>
    </div>
  {/if}
</div>
