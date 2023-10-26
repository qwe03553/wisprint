<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=UTF-8"%>
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
	String key = request.getParameter("data");
    String fileprefix = com.jatools.dddy.action.ExportDataCache.getInstance().get(key, "fileprefix");   
	response.setContentType("application/octet-stream");
	response.setHeader("Content-Disposition", String.format("attachment;filename=%s_%s.xlsx",fileprefix,GlobalScripts.format(new Date(), "yyyyMMddHHmmss")));
	ServletOutputStream sout = response.getOutputStream();
	com.jatools.dddy.action.ExportDataCache.getInstance().export(request.getParameter("data").toString(), sout);
	sout.flush();
	out.clear();
	out = pageContext.pushBody();
%>