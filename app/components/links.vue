<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <h2
        class="m-0 flex items-center justify-center p-2 max-lg:size-[3.4rem] lg:size-[3.8rem] max-sm:text-[1.7rem] lg:text-[2.2rem] max-lg:text-[1.7rem] font-bold leading-7 lg:leading-8 max-sm:hidden text-white dark:text-dark-4"
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
            <Card>
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
            <Card>
              <div
                class="w-full h-full bg-default flex justify-center items-center"
              >
                <img src="~/assets/x.svg" class="w-[20px] h-[20px]" />
              </div>
            </Card>
          </div>
        </a>
      </UTooltip>
    </div>

    <div class="flex gap-2">
      <!-- Instagram -->
      <UTooltip :delay-duration="0" text="Instagram" :content="{ side: 'top' }">
        <a
          href="https://x.com/cybrchad"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="w-[60px] h-[60px]">
            <Card>
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
            <Card>
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
            <Card>
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
