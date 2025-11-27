<template>
  <div class="flex flex-col gap-2 max-[722px]:justify-center">
    <div class="flex gap-2 flex-wrap max-[722px]:justify-center">
      <h2
        class="max-[950px]:hidden m-0 flex items-center justify-center p-2 size-[3.8rem] text-[2.2rem] font-bold leading-7 flex-wrap"
      >
        LIN<br />KS
      </h2>

      <!-- GitHub -->
      <UTooltip :delay-duration="0" text="GitHub" :content="{ side: 'top' }">
        <a
          href="https://github.com/siddharthroy12"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card fullHeight>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/github.svg" class="w-[30px] h-[30px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>

      <!-- X (Twitter) -->
      <UTooltip
        :delay-duration="0"
        text="X (Twitter)"
        :content="{ side: 'top' }"
      >
        <a
          href="https://x.com/cybrchad"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card fullHeight>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/x.svg" class="w-[20px] h-[20px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>
      <!-- Instagram -->
      <UTooltip :delay-duration="0" text="Instagram" :content="{ side: 'top' }">
        <a
          href="https://x.com/cybrchad"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card fullHeight>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/instagram.svg" class="w-[30px] h-[30px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>

      <!-- Threads -->
      <UTooltip :delay-duration="0" text="Threads" :content="{ side: 'top' }">
        <a
          href="https://www.threads.com/@cybrchad"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card fullHeight>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/threads.svg" class="w-[25px] h-[25px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>

      <!-- LinkedIn -->
      <UTooltip :delay-duration="0" text="LinkedIn" :content="{ side: 'top' }">
        <a
          href="https://www.linkedin.com/in/reactoverflow/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card fullHeight>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/linkdin.svg" class="w-[30px] h-[30px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>
    </div>
  </div>
</template>
