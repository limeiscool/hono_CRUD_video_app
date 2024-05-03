import { Hono } from 'hono'
import {poweredBy} from 'hono/powered-by'
import {logger} from 'hono/logger'
import dbConnect from './db/connect'
import VideoModel from './db/yt-model'
import { isValidObjectId } from 'mongoose'
import {stream, streamText, streamSSE} from 'hono/streaming'

const app = new Hono()

//middleware
app.use(poweredBy())
app.use(logger())

dbConnect()
  .then(() => {
    // get list
    app.get('/videos', async (c) => {
      try {
        const docs = await VideoModel.find({})
        if (docs.length > 0) {
          return c.json(docs.map((doc) => doc.toObject()), 200)
        }
        return c.text('No Videos', 200)
      } catch (error) {
        return c.json(
          (error as any)?.message || 'Something went wrong', 500
        )
      }
    })
    // create
    app.post('/video', async (c) => {
      const formData = await c.req.json()
      if (!formData.thumbnail) delete formData.thumbnail
      const VideoObj = new VideoModel(formData)
      try {
        const doc = await VideoObj.save()
        return c.json(doc.toObject(), 201)
      } catch (error) {
        return c.json(
          (error as any)?.message || 'Something went wrong', 500
        )
      }
    })
    // view doc by id
    app.get('/video/:id', async (c) => {
      const { id } = c.req.param()
      if (!isValidObjectId(id)) return c.json("Invalid ID", 400)  
      const doc = await VideoModel.findById(id)
      if (doc) {
        return c.json(doc.toObject(), 200)
      }
      return c.text('Not Found', 404)
    })

    app.get('video/d/:id', async (c) => {
      const { id } = c.req.param()
      if (!isValidObjectId(id)) return c.json("Invalid ID", 400)  
      const doc = await VideoModel.findById(id)
      if (doc) {
        return streamText(c, async (stream) => {
          stream.onAbort(() => {
            console.log('aborted')
          })
          for (let desc of doc.description) {
            stream.write(desc);
            await stream.sleep(40);
          }
        })}
      return c.text('Not Found', 404)
    })

    app.patch('video/:id', async (c) => {
      const { id } = c.req.param()
      if (!isValidObjectId(id)) return c.json("Invalid ID", 400)  
      const doc = await VideoModel.findById(id)
      if (!doc) return c.text('Not Found', 404)
      
      try {
        const formData = await c.req.json()
        if (!formData.thumbnail) delete formData.thumbnail
        Object.assign(doc, formData)
        await doc.save()
        return c.json(doc.toObject(), 200)
      } catch (error) {
        return c.json(
          (error as any)?.message || 'Something went wrong', 500
        )
      }
        
    })

    app.delete('video/:id', async (c) => {
      const { id } = c.req.param()
      if (!isValidObjectId(id)) return c.json("Invalid ID", 400)  
      try {
        const deletedDoc = await VideoModel.findByIdAndDelete(id)
        if (!deletedDoc) return c.text('Not Found', 404)
        return c.json({message: 'Deleted'}, 200)
      } catch (error) {
        return c.json(
          (error as any)?.message || 'Something went wrong', 500
        )
      }
    })

    app.delete('/videos/clear', async (c) => {
      try {
        await VideoModel.deleteMany({})
        return c.json({message: 'All videos deleted'}, 200)
      } catch (error) {
        return c.json(
          (error as any)?.message || 'Something went wrong', 500
        )
      }
    })



  })
  .catch((e) => {
    app.get('/*', (c) => {
      return c.text(`Connection Error: ${e.message}`)
    })
})

app.onError((err, c) => {
  return c.text(`An error occured: ${err.message}`)
})

app.get('/', (c) => {
  return c.text('Hello this is a Hono video CRUD app!')
})

export default app
