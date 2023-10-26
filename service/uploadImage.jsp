<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=UTF-8"%>
<%@ page import="java.io.*,java.util.*, javax.servlet.*"%>
<%@ page import="javax.servlet.http.*"%>
<%@ page import="org.apache.commons.fileupload.*"%>
<%@ page import="org.apache.commons.fileupload.disk.*"%>
<%@ page import="org.apache.commons.fileupload.servlet.*"%>
<%@ page import="org.apache.commons.io.output.*"%>
<%@ page import="org.apache.commons.codec.binary.Base64"%>
<%@ page import="org.apache.commons.io.FileUtils"%>
<%@ page import="com.jatools.mireport.*"%>
<%
	// 套打底图上传的路径
	String backgroundImages = AppContextServlet.getDataPath() + "service/images";
	ServletContext context = pageContext.getServletContext();
	// 准备好底图目录
	File imagesDir = new File(context.getRealPath(backgroundImages));
	if (!imagesDir.exists()) {
		imagesDir.mkdirs();
	}
	int maxFileSize = 15 * 1024 * 1024;
	int maxMemSize = 15 * 1024 * 1024; // 前端检测过了，这里不限制了
	byte[] bytes = null;
	String name = null;
	String contentType = request.getContentType();
	if ((contentType.indexOf("multipart/form-data") >= 0)) {
		DiskFileItemFactory factory = new DiskFileItemFactory();
		// maximum size that will be stored in memory
		factory.setSizeThreshold(maxMemSize);
		// Location to save data that is larger than maxMemSize.
		factory.setRepository(imagesDir);
		// Create a new file upload handler
		ServletFileUpload upload = new ServletFileUpload(factory);
		// maximum file size to be uploaded.
		upload.setSizeMax(maxFileSize);
		// Parse the request to get file items.
		List fileItems = upload.parseRequest(request);
		// Process the uploaded file items
		Iterator i = fileItems.iterator();
		while (i.hasNext()) {
			FileItem fi = (FileItem) i.next();
			if (!fi.isFormField()) {
				bytes = fi.get();
				name = fi.getName();
				out.print(Config.getInstance().getImageManager().upload(request, bytes, name));
				return;
			}
		}
	}
	out.print("{\"error\":\"未知错误\"}");
%>
