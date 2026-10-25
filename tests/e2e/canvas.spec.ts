import { test, expect } from '@playwright/test'
import LZString from 'lz-string'
import fs from 'node:fs/promises'

test('restores a Fabric 6 document, switches pages, and exports SVG', async ({
  page,
}) => {
  const snapshot = LZString.compress(
    JSON.stringify([
      {
        stackCursor: 0,
        snapshots: [
          {
            version: '6.1.0',
            objects: [
              {
                type: 'Rect',
                version: '6.1.0',
                left: 40,
                top: 40,
                width: 100,
                height: 60,
                fill: '#ff0000',
              },
              {
                type: 'Rect',
                version: '6.1.0',
                left: 250,
                top: 40,
                width: 100,
                height: 60,
                fill: {
                  type: 'linear',
                  gradientUnits: 'pixels',
                  coords: { x1: 0, y1: 0, x2: 100, y2: 0 },
                  colorStops: [
                    { offset: 0, color: '#0000ff', opacity: 0.5 },
                    { offset: 1, color: '#0000ff', opacity: 0.5 },
                  ],
                },
              },
              {
                type: 'Textbox',
                version: '6.1.0',
                left: 40,
                top: 200,
                width: 250,
                text: 'Legacy saved document',
                fontFamily: 'Arial',
                fontSize: 20,
              },
            ],
          },
        ],
      },
    ]),
  )
  await page.addInitScript((value) => {
    if (!localStorage.getItem('CANVAS_SVG_GLOBAL_SNAPSHOT'))
      localStorage.setItem('CANVAS_SVG_GLOBAL_SNAPSHOT', value)
  }, snapshot)
  await page.goto('/')
  await expect(page.locator('canvas.lower-canvas').first()).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('canvas.lower-canvas')
        .first()
        .evaluate((element) => {
          const pixel = (element as HTMLCanvasElement)
            .getContext('2d')!
            .getImageData(60, 60, 1, 1).data
          return pixel[0] > 200 && pixel[1] < 50 && pixel[3] > 0
        }),
    )
    .toBe(true)
  await page.getByRole('button', { name: 'Grid Layouting' }).click()
  await page.getByRole('button', { name: 'Grid Layouting' }).click()
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export as SVG' }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toBe('page_1.svg')
  const svg = await fs.readFile((await download.path())!, 'utf8')
  expect(svg).toContain('<svg')
  expect(svg).toMatch(/rgb\(255,0,0\)|#ff0000/i)
  expect(svg).toContain('Legacy saved document')
  expect(svg).toMatch(/stop-opacity[:=]["\s]*0\.5|rgba\(0,0,255,0\.5\)/)
  const bounds = await page.locator('canvas.upper-canvas').first().boundingBox()
  if (!bounds) throw new Error('Canvas bounds are unavailable')
  await page.mouse.move(bounds.x + 70, bounds.y + 70)
  await page.mouse.down()
  await page.mouse.move(bounds.x + 170, bounds.y + 70, { steps: 10 })
  await page.mouse.up()
  const originalPositionIsRed = () =>
    page
      .locator('canvas.lower-canvas')
      .first()
      .evaluate((element) => {
        const pixel = (element as HTMLCanvasElement)
          .getContext('2d')!
          .getImageData(60, 60, 1, 1).data
        return pixel[0] > 200 && pixel[1] < 50 && pixel[3] > 0
      })
  await expect.poll(originalPositionIsRed).toBe(false)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect.poll(originalPositionIsRed).toBe(true)
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect.poll(originalPositionIsRed).toBe(false)
  await page.getByRole('button', { name: 'Add Page' }).click()
  await expect(page.getByRole('tab', { name: 'Page 2' })).toBeVisible()
  await page.getByRole('tab', { name: 'Page 1', exact: true }).click()
  await page.reload()
  await expect(page.locator('canvas.lower-canvas').first()).toBeVisible()
})

test('imports SVG and preserves keyboard copy, cut and paste', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('canvas.lower-canvas')).toBeVisible()
  await page.locator('#inputImage').setInputFiles({
    name: 'fixture.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect x="20" y="20" width="100" height="60" fill="#0000ff"/></svg>',
    ),
  })
  await expect
    .poll(() =>
      page.locator('canvas.lower-canvas').evaluate((element) => {
        const pixel = (element as HTMLCanvasElement)
          .getContext('2d')!
          .getImageData(50, 50, 1, 1).data
        return pixel[2] > 200 && pixel[0] < 50
      }),
    )
    .toBe(true)
  const bounds = (await page.locator('canvas.upper-canvas').boundingBox())!
  await page.mouse.click(bounds.x + 50, bounds.y + 50)
  await page.keyboard.press('ControlOrMeta+c')
  await page.keyboard.press('ControlOrMeta+v')
  const rectCount = async () => {
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export as SVG' }).click()
    return (
      (await fs.readFile((await (await pending).path())!, 'utf8')).match(
        /<rect\b/g,
      ) || []
    ).length
  }
  expect(await rectCount()).toBe(2)
  await page.keyboard.press('ControlOrMeta+x')
  expect(await rectCount()).toBe(1)
  await page.keyboard.press('ControlOrMeta+v')
  expect(await rectCount()).toBe(2)
  expect(errors).toEqual([])
})
