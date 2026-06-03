# Blog posts

How to publish a new post:

1. Create `content/blogs/your-post-slug.mdx`
2. Add frontmatter at the top (copy from `welcome-to-our-blog.mdx`)
3. Set `published: false` while writing (won't appear in lists or URLs)
4. Write content in Markdown below the frontmatter
5. Set `published: true` when ready
6. `git add . && git commit -m "blog: your post title"`
7. `git push` → Render rebuilds → post is live at `/blog/your-post-slug`

Optional cover images go in `public/images/blogs/` and are referenced as:

```yaml
coverImage: "/images/blogs/your-image.png"
```
